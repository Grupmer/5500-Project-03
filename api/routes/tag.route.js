import express from "express";
import {
  createTag,
  getTags,
  getTagById,
  updateTag,
  deleteTag,
  hardDeleteTag,
  restoreTag
} from "../controllers/tag.controller.js";

const router = express.Router();

// Basic tag CRUD routes
router.post("/", createTag);
router.get("/", getTags);
router.get("/:id", getTagById);
router.put("/:id", updateTag);
router.delete("/:id", deleteTag);

// Advanced tag management routes
router.delete("/:id/hard", hardDeleteTag); // Hard delete for admin use
router.post("/:id/restore", restoreTag);   // Restore a soft-deleted tag

export default router; 