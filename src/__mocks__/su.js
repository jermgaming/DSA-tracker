const $ = {
  eq: jest.fn(),
  order: jest.fn(),
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  deleteFn: jest.fn(),
  upsert: jest.fn(),
  single: jest.fn(),
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  rpc: jest.fn(),
  from: jest.fn(),
  channel: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signInWithOAuth: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

function init() {
  $.eq.mockReturnThis();
  $.order.mockReturnThis();
  $.select.mockReturnThis();
  $.insert.mockReturnThis();
  $.update.mockReturnThis();
  $.deleteFn.mockReturnThis();
  $.upsert.mockReturnThis();
  $.on.mockReturnThis();
  $.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe });

  $.from.mockImplementation(() => ({
    eq: $.eq, order: $.order, select: $.select,
    insert: $.insert, update: $.update,
    delete: $.deleteFn, upsert: $.upsert,
    single: $.single, on: $.on, subscribe: $.subscribe,
  }));

  $.channel.mockReturnValue({
    on: $.on,
    subscribe: $.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe }),
  });
}
init();

function reset() {
  Object.values($).forEach(fn => {
    if (typeof fn.mockClear === 'function') fn.mockClear();
  });
  init();
}

function createClient() {
  return {
    auth: {
      getSession: $.getSession,
      onAuthStateChange: $.onAuthStateChange,
      signInWithOAuth: $.signInWithOAuth,
      signInWithPassword: $.signInWithPassword,
      signUp: $.signUp,
      signOut: $.signOut,
    },
    from: $.from,
    channel: $.channel,
    rpc: $.rpc,
  };
}

module.exports = { createClient, m: $, reset };
