import { getSession } from '../helpers/sessionHelper';

export default {
  state: {
    session: getSession(),
  },
  mutations: {
    setSession(state, sessionData) {
      state.session = sessionData;
    },
    clearSession(state) {
      state.session = null;
    },
  },
};
