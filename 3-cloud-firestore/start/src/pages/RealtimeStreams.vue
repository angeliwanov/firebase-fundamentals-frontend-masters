<script setup>
import { onMounted, reactive, onBeforeUnmount } from "vue";
import UserExcersize from "../components/UserExcersize.vue";
import { getFirebase } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

const { firestore } = getFirebase();
const usersCol = collection(firestore, "users");

const state = bindToTable(usersCol);

function bindToTable(expensesQuery) {
  const state = reactive({ results: [] });
  let subscription = null;
  onMounted(() => {
    subscription = bindToState(state, expensesQuery);
  });
  onBeforeUnmount(() => {
    subscription();
  });
  return state;
}

function bindToState(state, query, transform = formatUser) {
  // 1. Create a realtime listener
  onSnapshot(usersCol, (snapshot) => {
    state.results = snapshot.docs.map(formatUser);
  });
}

function formatUser(docSnapshot) {
  // 2. Transform the object returned
  const { uuid, first, last, highscore, city } = docSnapshot.data();
  const { fromCache } = docSnapshot.metadata;
  return {
    uuid,
    first,
    last,
    highscore,
    city,
    fromCache,
  };
}
</script>

<template>
  <main>
    <UserExcersize
      number="1"
      subtitle="Reading data"
      :results="state.results"
    />
  </main>
</template>

<style></style>
