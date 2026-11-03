import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { Requirement } from "../src/models/Requirement.js";

process.env.NODE_ENV = "test";

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Requirement.deleteMany({});
});

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const basics = {
  eventName: "Annual Gala",
  eventType: "corporate",
  dateType: "single",
  startDate: daysFromNow(30),
  location: "Mumbai",
  venue: "Taj Lands End",
  contact: { name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210" },
};

const planner = {
  ...basics,
  category: "planner",
  details: {
    services: ["full_planning", "decor"],
    guestCount: 250,
    budgetMin: 500000,
    budgetMax: 800000,
    theme: "Art deco",
    experienceLevel: "3_5_years",
  },
};

const performer = {
  ...basics,
  category: "performer",
  details: {
    performerType: "band",
    genres: ["Bollywood", "Rock"],
    performerCount: 5,
    durationMinutes: 90,
    languages: ["Hindi"],
    equipmentProvided: false,
    budgetMin: 100000,
    budgetMax: 150000,
  },
};

const crew = {
  ...basics,
  category: "crew",
  details: {
    roles: [
      { role: "photographer", count: 2 },
      { role: "sound_technician", count: 1 },
    ],
    callTime: "16:30",
    hoursPerDay: 8,
    budgetPerPerson: 8000,
    equipmentProvided: true,
  },
};

describe("POST /api/requirements", () => {
  it.each([
    ["planner", planner],
    ["performer", performer],
    ["crew", crew],
  ])("saves a %s requirement tagged with its category", async (category, payload) => {
    const res = await request(app).post("/api/requirements").send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.category).toBe(category);
    expect(res.body.data.id).toBeDefined();

    const stored = await mongoose.connection.collection("requirements").findOne({
      _id: new mongoose.Types.ObjectId(res.body.data.id),
    });
    expect(stored?.category).toBe(category);
    expect(stored?.details).toMatchObject(payload.details);
  });

  it("rejects missing required fields with field-level details", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...planner, eventName: "  ", location: undefined });

    expect(res.status).toBe(400);
    const paths = res.body.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["eventName", "location"]));
  });

  it("rejects an unknown category", async () => {
    const res = await request(app).post("/api/requirements").send({ ...planner, category: "caterer" });
    expect(res.status).toBe(400);
  });

  it("rejects a date range that ends before it starts", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...crew, dateType: "range", startDate: daysFromNow(10), endDate: daysFromNow(5) });

    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe("endDate");
  });

  it("requires an end date for a range", async () => {
    const res = await request(app).post("/api/requirements").send({ ...crew, dateType: "range" });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe("endDate");
  });

  it("drops endDate for a single-day event", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...planner, endDate: daysFromNow(40) });
    expect(res.status).toBe(201);
    expect(res.body.data.endDate).toBeUndefined();
  });

  it("rejects a start date in the past", async () => {
    const res = await request(app).post("/api/requirements").send({ ...planner, startDate: daysFromNow(-5) });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe("startDate");
  });

  it("rejects min budget greater than max budget", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...performer, details: { ...performer.details, budgetMin: 200000, budgetMax: 1000 } });
    expect(res.status).toBe(400);
    expect(res.body.details[0].path).toBe("details.budgetMax");
  });

  it("rejects crew with no roles or duplicate roles", async () => {
    const empty = await request(app)
      .post("/api/requirements")
      .send({ ...crew, details: { ...crew.details, roles: [] } });
    expect(empty.status).toBe(400);

    const dup = await request(app)
      .post("/api/requirements")
      .send({
        ...crew,
        details: {
          ...crew.details,
          roles: [
            { role: "security", count: 2 },
            { role: "security", count: 1 },
          ],
        },
      });
    expect(dup.status).toBe(400);
    expect(dup.body.details[0].path).toBe("details.roles.1.role");
  });

  it("does not store fields that belong to another category", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .send({ ...planner, details: { ...planner.details, performerType: "dj", roles: [] } });

    expect(res.status).toBe(201);
    expect(res.body.data.details.performerType).toBeUndefined();
    expect(res.body.data.details.roles).toBeUndefined();
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await request(app)
      .post("/api/requirements")
      .set("Content-Type", "application/json")
      .send("{bad json");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/requirements", () => {
  beforeEach(async () => {
    await request(app).post("/api/requirements").send(planner);
    await request(app).post("/api/requirements").send(performer);
    await request(app).post("/api/requirements").send(crew);
    await request(app).post("/api/requirements").send(crew);
  });

  it("lists all requirements newest first with counts per category", async () => {
    const res = await request(app).get("/api/requirements");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.pagination.total).toBe(4);
    expect(res.body.countsByCategory).toEqual({ planner: 1, performer: 1, crew: 2 });
  });

  it("filters by category", async () => {
    const res = await request(app).get("/api/requirements?category=crew");
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((r: { category: string }) => r.category === "crew")).toBe(true);
  });

  it("paginates", async () => {
    const res = await request(app).get("/api/requirements?limit=3&page=2");
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it("rejects an invalid category filter", async () => {
    const res = await request(app).get("/api/requirements?category=caterer");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/requirements/:id", () => {
  it("returns a single requirement", async () => {
    const created = await request(app).post("/api/requirements").send(performer);
    const res = await request(app).get(`/api/requirements/${created.body.data.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.details.performerType).toBe("band");
  });

  it("returns 400 for an invalid id and 404 for a missing one", async () => {
    expect((await request(app).get("/api/requirements/not-an-id")).status).toBe(400);
    expect((await request(app).get(`/api/requirements/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
  });
});

describe("misc routes", () => {
  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.body).toEqual({ status: "ok", db: "connected" });
  });

  it("404s unknown routes", async () => {
    expect((await request(app).get("/api/nope")).status).toBe(404);
  });
});
