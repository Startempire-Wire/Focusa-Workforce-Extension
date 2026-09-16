/**
 * Workforce full-page entry. Mounts the Svelte 5 app.
 */
import { mount } from 'svelte';
import App from './App.svelte';

mount(App, { target: document.getElementById('workforce-root') });
