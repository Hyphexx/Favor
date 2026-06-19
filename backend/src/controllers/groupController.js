import crypto from "node:crypto";
import Favor from "../models/Favor.js";
import Group from "../models/Group.js";

function isMember(group, userId) {
  return group.members.some((member) => member.user.toString() === userId.toString());
}

async function makeUniqueCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();
    if (!(await Group.exists({ code }))) return code;
  }

  throw new Error("Could not create a unique group code.");
}

function groupResponse(group) {
  return {
    _id: group._id,
    name: group.name,
    code: group.code,
    leader: group.leader,
    members: group.members,
    createdAt: group.createdAt,
  };
}

export async function listGroups(req, res, next) {
  try {
    const groups = await Group.find({ "members.user": req.user._id })
      .populate("leader", "username")
      .populate("members.user", "username")
      .sort({ updatedAt: -1 });

    return res.json(groups.map(groupResponse));
  } catch (error) {
    return next(error);
  }
}

export async function createGroup(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: "Group name must be 2-50 characters." });
    }

    const group = await Group.create({
      name,
      code: await makeUniqueCode(),
      leader: req.user._id,
      members: [{ user: req.user._id }],
    });

    await group.populate("leader", "username");
    await group.populate("members.user", "username");
    return res.status(201).json(groupResponse(group));
  } catch (error) {
    return next(error);
  }
}

export async function joinGroup(req, res, next) {
  try {
    const code = String(req.body.code || "").trim().toUpperCase();
    const group = await Group.findOne({ code });

    if (!group) {
      return res.status(404).json({ message: "No group was found with that code." });
    }

    if (!isMember(group, req.user._id)) {
      group.members.push({ user: req.user._id });
      await group.save();
    }

    await group.populate("leader", "username");
    await group.populate("members.user", "username");
    return res.json(groupResponse(group));
  } catch (error) {
    return next(error);
  }
}

export async function deleteGroup(req, res, next) {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (group.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the group leader can delete this group." });
    }

    await Favor.deleteMany({ group: group._id });
    await group.deleteOne();
    return res.json({ message: "Group deleted." });
  } catch (error) {
    return next(error);
  }
}
