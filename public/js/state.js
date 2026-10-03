// Smart Campus Helpdesk - Application State

class StateManager {
  constructor() {
    this.user = null;
    this.categories = [];
    this.currentRoute = 'login';
    this.listeners = [];
  }

  setUser(user) {
    this.user = user;
    if (user) {
      this.currentRoute = 'dashboard';
    } else {
      this.currentRoute = 'login';
    }
    this.notify();
  }

  setCategories(categories) {
    this.categories = categories;
    this.notify();
  }

  setRoute(route) {
    this.currentRoute = route;
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    }
  }
}

export const state = new StateManager();
