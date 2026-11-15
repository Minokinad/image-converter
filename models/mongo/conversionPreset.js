const mongoose = require("mongoose");

const formats = ["png", "jpeg", "webp", "avif"];
const filters = ["none", "grayscale", "sepia"];
const dimension = {
  type: Number,
  min: 1,
  max: 10000,
  default: null,
  validate: {
    validator: (value) => value === null || Number.isInteger(value),
    message: "Размер должен быть целым числом",
  },
};

const outputSchema = new mongoose.Schema({
  targetFormat: { type: String, enum: formats, required: true },
  width: dimension,
  height: dimension,
  filter: { type: String, enum: filters, required: true, default: "none" },
}, { _id: false });

const presetSchema = new mongoose.Schema({
  ownerId: { type: Number, required: true, immutable: true },
  name: { type: String, trim: true, required: true, maxlength: 80 },
  outputs: {
    type: [outputSchema],
    required: true,
    validate: {
      validator: (outputs) => outputs.length > 0 && outputs.every(Boolean) &&
        new Set(outputs.map((output) => output.targetFormat)).size === outputs.length,
      message: "Укажите хотя бы один выходной формат. Форматы не должны повторяться",
    },
  },
}, { timestamps: true, versionKey: false, bufferCommands: false });

presetSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("ConversionPreset", presetSchema, "conversion_presets");
