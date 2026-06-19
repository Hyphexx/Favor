import Favor from "../models/Favor.js";
import Group from "../models/Group.js";

const favorPopulate = [
  { path: "postedBy", select: "username" },
  { path: "helper", select: "username" },
  { path: "pickupRequests.user", select: "username" },
];

function sameId(left, right) {
  return Boolean(left && right && left.toString() === right.toString());
}

function memberOf(group, userId) {
  return group.members.some((member) => sameId(member.user, userId));
}

async function getFavorAndGroup(favorId) {
  const favor = await Favor.findById(favorId);
  if (!favor) return {};
  const group = await Group.findById(favor.group);
  return { favor, group };
}

async function populated(favor) {
  await favor.populate(favorPopulate);
  return favor;
}

export async function listFavors(req, res, next) {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Group not found." });
    }

    const favors = await Favor.find({ group: group._id })
      .populate(favorPopulate)
      .sort({ createdAt: -1 });
    return res.json(favors);
  } catch (error) {
    return next(error);
  }
}

export async function createFavor(req, res, next) {
  try {
    const group = await Group.findById(req.body.groupId);
    const title = String(req.body.title || "").trim();
    const details = String(req.body.details || "").trim();

    if (!group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (title.length < 3 || title.length > 90) {
      return res.status(400).json({ message: "Title must be 3-90 characters." });
    }

    if (details.length > 600) {
      return res.status(400).json({ message: "Details must be 600 characters or fewer." });
    }

    const favor = await Favor.create({
      group: group._id,
      title,
      details,
      category: req.body.category,
      dueDate: req.body.dueDate || null,
      postedBy: req.user._id,
    });

    return res.status(201).json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function pickupFavor(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    if (favor.status === "complete") {
      return res.status(400).json({ message: "Completed favors cannot be picked up." });
    }

    if (sameId(favor.helper, req.user._id)) {
      return res.status(400).json({ message: "You already have this favor." });
    }

    if (!favor.helper) {
      favor.helper = req.user._id;
      favor.status = "in_progress";
      favor.completedAt = null;
      favor.pickupRequests = favor.pickupRequests.filter(
        (request) => !sameId(request.user, req.user._id)
      );
      await favor.save();
      return res.json(await populated(favor));
    }

    const alreadyRequested = favor.pickupRequests.some((request) =>
      sameId(request.user, req.user._id)
    );

    if (!alreadyRequested) {
      favor.pickupRequests.push({ user: req.user._id });
      await favor.save();
    }

    return res.json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function withdrawPickupRequest(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    favor.pickupRequests = favor.pickupRequests.filter(
      (request) => !sameId(request.user, req.user._id)
    );
    await favor.save();
    return res.json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function acceptPickupRequest(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    const canTransfer =
      sameId(favor.postedBy, req.user._id) || sameId(favor.helper, req.user._id);

    if (!canTransfer) {
      return res.status(403).json({ message: "Only the poster or current helper can transfer it." });
    }

    if (favor.status === "complete") {
      return res.status(400).json({ message: "Reopen the favor before transferring it." });
    }

    const requestExists = favor.pickupRequests.some((request) =>
      sameId(request.user, req.params.userId)
    );

    if (!requestExists) {
      return res.status(404).json({ message: "That pickup request no longer exists." });
    }

    favor.helper = req.params.userId;
    favor.status = "in_progress";
    favor.completedAt = null;
    favor.pickupRequests = favor.pickupRequests.filter(
      (request) => !sameId(request.user, req.params.userId)
    );
    await favor.save();
    return res.json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function changeStatus(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);
    const nextStatus = req.body.status;

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    const canChange =
      sameId(favor.postedBy, req.user._id) || sameId(favor.helper, req.user._id);

    if (!canChange) {
      return res.status(403).json({ message: "Only the poster or current helper can change status." });
    }

    const allowedTransitions = {
      posted: ["in_progress"],
      in_progress: ["posted", "complete"],
      complete: ["in_progress"],
    };

    if (!allowedTransitions[favor.status]?.includes(nextStatus)) {
      return res.status(400).json({ message: "Status can only move one step at a time." });
    }

    if (nextStatus === "in_progress" && !favor.helper) {
      favor.helper = req.user._id;
    }

    favor.status = nextStatus;
    favor.completedAt = nextStatus === "complete" ? new Date() : null;
    await favor.save();
    return res.json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function dropFavor(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    if (!sameId(favor.helper, req.user._id)) {
      return res.status(403).json({ message: "Only the current helper can drop this favor." });
    }

    if (favor.status === "complete") {
      return res.status(400).json({ message: "Reopen the favor before dropping it." });
    }

    favor.helper = null;
    favor.status = "posted";
    favor.completedAt = null;
    await favor.save();
    return res.json(await populated(favor));
  } catch (error) {
    return next(error);
  }
}

export async function deleteFavor(req, res, next) {
  try {
    const { favor, group } = await getFavorAndGroup(req.params.favorId);

    if (!favor || !group || !memberOf(group, req.user._id)) {
      return res.status(404).json({ message: "Favor not found." });
    }

    const canDelete =
      sameId(favor.postedBy, req.user._id) || sameId(group.leader, req.user._id);

    if (!canDelete) {
      return res.status(403).json({ message: "Only the poster or group leader can delete it." });
    }

    await favor.deleteOne();
    return res.json({ message: "Favor deleted." });
  } catch (error) {
    return next(error);
  }
}
