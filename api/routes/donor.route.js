import express from "express";
import {
  createDonor,
  getDonors,
  getDonorById,
  updateDonor,
  deleteDonor,
  hardDeleteDonor,
  restoreDonor,
  addTagToDonor,
  removeTagFromDonor,
  addInterestDomainToDonor,
  removeInterestDomainFromDonor,
  addDonationToDonor
} from "../controllers/donor.controller.js";

const router = express.Router();

// Basic donor CRUD routes
router.post("/", createDonor);
router.get("/", getDonors);
router.get("/:id", getDonorById);
router.put("/:id", updateDonor);
router.delete("/:id", deleteDonor);

// Advanced donor management routes
router.delete("/:id/hard", hardDeleteDonor); // Hard delete for admin use
router.post("/:id/restore", restoreDonor);  // Restore a soft-deleted donor

// Donor-donation relationship routes
router.post("/donations", addDonationToDonor);

// Donor-tag relationship routes
router.post("/tags", addTagToDonor);
router.delete("/:donorId/tags/:tagId", removeTagFromDonor);

// Donor-interest domain relationship routes
router.post("/interest-domains", addInterestDomainToDonor);
router.delete("/:donorId/interest-domains/:interestDomainId", removeInterestDomainFromDonor);

export default router; 