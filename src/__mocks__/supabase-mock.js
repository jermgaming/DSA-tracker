// Shared supabase mock factory - import in test files via jest.mock
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

function chain() {
  return {
    eq: $.eq,
    order: $.order,
    select: $.select,
    insert: $.insert,
    update: $.update,
    delete: $.deleteFn,
    upsert: $.upsert,
    single: $.single,
    on: $.on,
    subscribe: $.subscribe,
  };
}

$.eq.mockReturnThis();
$.order.mockReturnThis();
$.select.mockReturnThis();
$.insert.mockReturnThis();
$.update.mockReturnThis();
$.deleteFn.mockReturnThis();
$.upsert.mockReturnThis();
$.on.mockReturnThis();
$.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe });
$.from.mockImplementation(() => chain());
$.channel.mockReturnValue({ on: $.on, subscribe: $.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe }) });

function createMockClient() {
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

function resetAll() {
  $.eq.mockReset();
  $.order.mockReset();
  $.select.mockReset();
  $.insert.mockReset();
  $.update.mockReset();
  $.deleteFn.mockReset();
  $.upsert.mockReset();
  $.single.mockReset();
  $.on.mockReset();
  $.subscribe.mockReset();
  $.unsubscribe.mockReset();
  $.rpc.mockReset();
  $.from.mockReset();
  $.channel.mockReset();
  $.getSession.mockReset();
  $.onAuthStateChange.mockReset();
  $.signInWithOAuth.mockReset();
  $.signInWithPassword.mockReset();
  $.signUp.mockReset();
  $.signOut.mockReset();

  $.eq.mockReturnThis();
  $.order.mockReturnThis();
  $.select.mockReturnThis();
  $.insert.mockReturnThis();
  $.update.mockReturnThis();
  $.deleteFn.mockReturnThis();
  $.upsert.mockReturnThis();
  $.on.mockReturnThis();
  $.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe });
  $.from.mockImplementation(() => chain());
  $.channel.mockReturnValue({ on: $.on, subscribe: $.subscribe.mockReturnValue({ unsubscribe: $.unsubscribe }) });
}

module.exports = { mocks: $, createMockClient, resetAll };
