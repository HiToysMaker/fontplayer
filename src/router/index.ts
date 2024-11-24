import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Welcome from '../fontEditor/views/Welcome.vue'
import Editor from '../fontEditor/views/Editor.vue'
import CharacterProgrammingEditor from '../fontEditor/views/CharacterProgrammingEditor.vue'
import GlyphProgrammingEditor from '../fontEditor/views/GlyphProgrammingEditor.vue'

const router = createRouter({
  // history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: Welcome,
    },
    {
      path: '/editor',
      name: 'editor',
      component: Editor,
    },
    {
      path: '/character-programming-editor',
      name: 'character-programming-editor',
      component: CharacterProgrammingEditor,
    },
    {
      path: '/glyph-programming-editor',
      name: 'glyph-programming-editor',
      component: GlyphProgrammingEditor,
    },
  ]
})

router.beforeEach((to, from, next) => {
  // Ensure the logic is minimal and efficient
  next();
});

export default router