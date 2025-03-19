import express from "express";
import {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  deleteDonation,
  hardDeleteDonation,
  restoreDonation
} from "../controllers/donation.controller.js";

const router = express.Router();

// Basic donation CRUD routes
router.post("/", createDonation);
router.get("/", getDonations);
router.get("/:id", getDonationById);
router.put("/:id", updateDonation);
router.delete("/:id", deleteDonation);

// Advanced donation management routes
router.delete("/:id/hard", hardDeleteDonation); // Hard delete for admin use
router.post("/:id/restore", restoreDonation);   // Restore a soft-deleted donation

export default router; 