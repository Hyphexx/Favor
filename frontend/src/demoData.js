export const demoUser = {
  id: "user-maya",
  username: "maya",
};

export const demoGroups = [
  {
    _id: "group-roommates",
    name: "Maple House",
    code: "MAPLE8",
    leader: { _id: "user-maya", username: "maya" },
    members: [
      { user: { _id: "user-maya", username: "maya" } },
      { user: { _id: "user-jules", username: "jules" } },
      { user: { _id: "user-sam", username: "sam" } },
      { user: { _id: "user-noah", username: "noah" } },
    ],
  },
  {
    _id: "group-study",
    name: "Tuesday Study Crew",
    code: "BIO214",
    leader: { _id: "user-sam", username: "sam" },
    members: [
      { user: { _id: "user-maya", username: "maya" } },
      { user: { _id: "user-sam", username: "sam" } },
      { user: { _id: "user-noah", username: "noah" } },
    ],
  },
  {
    _id: "group-volunteers",
    name: "Garden Volunteers",
    code: "GROW24",
    leader: { _id: "user-jules", username: "jules" },
    members: [
      { user: { _id: "user-maya", username: "maya" } },
      { user: { _id: "user-jules", username: "jules" } },
    ],
  },
];

export const demoFavors = [
  {
    _id: "favor-1",
    group: "group-roommates",
    title: "Grab oat milk on your way home",
    details:
      "We are completely out. Any brand is fine, just make sure it is the unsweetened kind. I can send you the money tonight.",
    category: "Errand",
    dueDate: "2026-06-18T23:00:00.000Z",
    status: "posted",
    postedBy: { _id: "user-jules", username: "jules" },
    helper: null,
    pickupRequests: [],
    createdAt: "2026-06-18T13:10:00.000Z",
  },
  {
    _id: "favor-2",
    group: "group-roommates",
    title: "Water the porch plants",
    details:
      "One good soak for the herbs and the two hanging baskets. The watering can is under the kitchen sink.",
    category: "Home",
    dueDate: "2026-06-19T01:00:00.000Z",
    status: "in_progress",
    postedBy: { _id: "user-noah", username: "noah" },
    helper: { _id: "user-maya", username: "maya" },
    pickupRequests: [
      {
        user: { _id: "user-sam", username: "sam" },
        requestedAt: "2026-06-18T14:20:00.000Z",
      },
    ],
    createdAt: "2026-06-17T21:20:00.000Z",
  },
  {
    _id: "favor-3",
    group: "group-roommates",
    title: "Drop library books at the return",
    details: "They are in the blue tote by the front door. No rush after Friday afternoon.",
    category: "Errand",
    dueDate: "2026-06-20T20:00:00.000Z",
    status: "posted",
    postedBy: { _id: "user-maya", username: "maya" },
    helper: null,
    pickupRequests: [],
    createdAt: "2026-06-18T09:00:00.000Z",
  },
  {
    _id: "favor-4",
    group: "group-roommates",
    title: "Bring the recycling bins back in",
    details: "Both bins are at the curb. Thanks!",
    category: "Home",
    dueDate: null,
    status: "complete",
    postedBy: { _id: "user-sam", username: "sam" },
    helper: { _id: "user-jules", username: "jules" },
    pickupRequests: [],
    createdAt: "2026-06-16T12:10:00.000Z",
    completedAt: "2026-06-17T17:30:00.000Z",
  },
  {
    _id: "favor-5",
    group: "group-study",
    title: "Share notes from Monday's lecture",
    details: "I missed the section on cell signaling. Photos or a scan both work.",
    category: "Study",
    dueDate: "2026-06-21T18:00:00.000Z",
    status: "posted",
    postedBy: { _id: "user-sam", username: "sam" },
    helper: null,
    pickupRequests: [],
    createdAt: "2026-06-18T15:00:00.000Z",
  },
];
