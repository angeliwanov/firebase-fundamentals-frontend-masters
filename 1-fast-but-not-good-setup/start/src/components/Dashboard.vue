<script setup>
import { onMounted, reactive, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
} from "firebase/firestore";
import { config } from "../config";
import { getAuth } from "firebase/auth";

const firebaseApp = initializeApp(config.firebase);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const markdownCol = collection(firestore, "markdowns");

const state = reactive({ markdowns: [] });
const router = useRouter();

onBeforeMount(async () => {
  // Get a user
  state.user = auth.currentUser;
  console.log(auth.currentUser);
});

onMounted(() => {
  onSnapshot(markdownCol, (snapshot) => {
    state.markdowns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
});

function newMarkdown() {
  const newDoc = doc(markdownCol);
  setDoc(newDoc, { markdown: "", converted: "" });
  router.push(`/editor/${newDoc.id}`);
}
</script>

<template>
  <h1>I am the dashboard</h1>

  <ul v-for="markdown in state.markdowns" :key="markdown.id">
    <li>
      <router-link :to="{ path: `/editor/${markdown.id}` }">{{
        markdown.id
      }}</router-link>
    </li>
  </ul>

  <button @click="newMarkdown">New</button>
</template>
