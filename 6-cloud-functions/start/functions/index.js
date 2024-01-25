const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");

const firebaseApp = initializeApp(functions.config().firebase);
const firestore = getFirestore();
const auth = getAuth();
// 1. Return a webpage with the current date, set a CDN cache for an hour
exports.ssr = functions.https.onRequest((request, response) => {
  response.set(`Cache-Control`, `public, max-age=500, s-maxage=1000`);
  response.send(`<h1>${Date.now()}</h1>`);
});

// 2. When a user updates their info, copy it across their expenses
exports.updateUserExpenses = functions.firestore
  .document("/users/{uid}")
  .onUpdate(async (change, context) => {
    const { after } = change;
    const user = after.data();
    const { uid } = context.params;
    const expensesQuery = firestore.collection("expenses").where("uid", "==");
    const snapshot = await expensesQuery.get();
    const batch = firestore.batch();
    snapshot.forEach((snapshot) => {
      batch.update(snapshot.ref, { user });
    });

    await batch.commit();
  });

// 3. When a user adds a collaboratorRequest to their "budget", look up the
// uid by their email, and if they exist add them as a collaborator.
exports.addCollaborator = functions.firestore
  .document("/budgets/{budgetId}/collaboratorRequests/{email}")
  .onCreate(async (snapshot, context) => {
    const { email, budgetId } = context.params;
    try {
      const userRecord = await auth.getUserByEmail(email);
    } catch (error) {
      return Promise.resolve();
    }
    const userRecord = await auth.getUserByEmail(email);
    // /budgets/{budgetId}/collaborators/{uid}
    const uidDoc = firestore
      .collection("budgets")
      .doc(budgetId)
      .collection("collaborators")
      .doc(userRecord.uid);

    return uidDoc.set({ role: "collaborator" });
  });

// 4. When a user is created, check if they have any collaboratorRequests that
// exist and set them as collaborators.
exports.userCreated = functions.auth.user().onCreate(async (user) => {
  const groupQuery = firestore
    .collectionGroup("collaboratorRequests")
    .where("email", "==", user.email);
  const snapshots = await groupQuery.get();
  const batch = firestore.batch();
  snapshots.docs.forEach((d) => {
    //budgets/good_budget
    const budgetDoc = d.ref.parent;
    //budgets/good_budget/collaborators/david_123
    const collaboratorDoc = budgetDoc.doc(user.uid);
    batch.set(collaboratorDoc, { role: "collaborator" });
  });

  return batch.commit();
});
