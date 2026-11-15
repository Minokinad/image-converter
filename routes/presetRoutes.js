const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const presets = require("../models/mongo/conversionPreset");

const router = express.Router();
const updateOptions = { returnDocument: "after", runValidators: true };

function fail(res, status, error) {
  return res.status(status).json({ success: false, error });
}

function sendPreset(res, data) {
  if (!data) return fail(res, 404, "Пресет или выходной формат не найден");
  return res.json({ success: true, data });
}

function presetFields(body) {
  return {
    name: body?.name ?? null,
    outputs: Array.isArray(body?.outputs) ? body.outputs : null,
  };
}

router.use(auth);
router.param("id", (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return fail(res, 400, "Некорректный ID пресета");
  req.presetFilter = { _id: id, ownerId: req.user.id };
  next();
});

router.get("/", async (req, res) => {
  const data = await presets.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, count: data.length, data });
});

router.post("/", async (req, res) => {
  const data = await presets.create({ ...presetFields(req.body), ownerId: req.user.id });
  res.status(201).json({ success: true, data });
});

router.get("/:id", async (req, res) => {
  sendPreset(res, await presets.findOne(req.presetFilter));
});

router.put("/:id", async (req, res) => {
  const data = await presets.findOneAndUpdate(req.presetFilter, {
    $set: presetFields(req.body),
  }, updateOptions);
  sendPreset(res, data);
});

router.patch("/:id/outputs/:format", async (req, res) => {
  const changes = {};
  for (const field of ["width", "height", "filter"]) {
    if (Object.hasOwn(req.body ?? {}, field)) changes[`outputs.$.${field}`] = req.body[field];
  }
  if (!Object.keys(changes).length) return fail(res, 400, "Укажите ширину, высоту или фильтр");

  const data = await presets.findOneAndUpdate({
    ...req.presetFilter,
    "outputs.targetFormat": req.params.format,
  }, { $set: changes }, updateOptions);
  sendPreset(res, data);
});

router.delete("/:id", async (req, res) => {
  sendPreset(res, await presets.findOneAndDelete(req.presetFilter));
});

router.use((error, req, res, next) => {
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    return fail(res, 400, error.message);
  }
  next(error);
});

module.exports = router;
