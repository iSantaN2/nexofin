import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const PROJECT_ID = "demo-nexofin";
const RULES_PATH = resolve(process.cwd(), "firestore.rules");
const hasFirestoreEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

let testEnv;

function userDb(uid) {
  return testEnv.authenticatedContext(uid).firestore();
}

async function seedDocument(path, value) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), value);
  });
}

const describeRules = hasFirestoreEmulator ? describe : describe.skip;

describeRules("firestore.rules", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: readFileSync(RULES_PATH, "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it("allows a user to read their own transaction", async () => {
    await seedDocument("transactions/tx-1", {
      uid: "user-1",
      category: "Comida",
      account: "Efectivo",
      amount: 45,
      date: "2026-06-19T08:00:00.000Z",
      createdAt: "2026-06-19T08:00:00.000Z",
      type: "Gasto",
      notes: "",
    });

    await assertSucceeds(getDoc(doc(userDb("user-1"), "transactions/tx-1")));
  });

  it("rejects reading another user's transaction", async () => {
    await seedDocument("transactions/tx-2", {
      uid: "owner-user",
      category: "Comida",
      account: "Tarjeta",
      amount: 60,
      date: "2026-06-19T08:00:00.000Z",
      createdAt: "2026-06-19T08:00:00.000Z",
      type: "Gasto",
      notes: "",
    });

    await assertFails(getDoc(doc(userDb("intruder"), "transactions/tx-2")));
  });

  it("rejects creating a transaction when uid does not match auth", async () => {
    await assertFails(
      setDoc(doc(userDb("user-1"), "transactions/tx-3"), {
        uid: "user-2",
        category: "Comida",
        account: "Efectivo",
        amount: 25,
        date: "2026-06-19T08:00:00.000Z",
        createdAt: "2026-06-19T08:00:00.000Z",
        type: "Gasto",
        notes: "",
      })
    );
  });

  it("rejects creating a budget with invalid amount", async () => {
    await assertFails(
      setDoc(doc(userDb("user-1"), "budgets/budget-1"), {
        uid: "user-1",
        category: "Comida",
        monthKey: "2026-06",
        limitAmount: 0,
        createdAt: "2026-06-19T08:00:00.000Z",
        updatedAt: "2026-06-19T08:00:00.000Z",
      })
    );
  });

  it("allows the owner to create notification settings with valid booleans", async () => {
    await assertSucceeds(
      setDoc(doc(userDb("user-1"), "notificationSettings/user-1"), {
        uid: "user-1",
        budget80Enabled: true,
        budget100Enabled: true,
        dailyReminderEnabled: false,
        createdAt: "2026-06-19T08:00:00.000Z",
        updatedAt: "2026-06-19T08:00:00.000Z",
      })
    );
  });

  it("allows the owner to create a user profile with alias and optional identity fields", async () => {
    await assertSucceeds(
      setDoc(doc(userDb("user-1"), "users/user-1"), {
        uid: "user-1",
        email: "qa@nexofin.test",
        alias: "Nicky",
        displayName: "Nicky",
        photoURL: "",
        firstName: "Nicole",
        lastName: "Santos",
        phone: "999888777",
        address: "Lima",
        currency: "PEN",
        onboardingCompleted: false,
        createdAt: "2026-06-19T08:00:00.000Z",
        updatedAt: "2026-06-19T08:00:00.000Z",
      })
    );
  });
});
