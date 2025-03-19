import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

// Create a new donor
export const createDonor = async (req, res, next) => {
  try {
    const donorData = req.body;
    
    // Handle interest domains if provided
    let interestDomains;
    if (donorData.interest_domains) {
      interestDomains = donorData.interest_domains;
      delete donorData.interest_domains;
    }
    
    // Create the donor
    const donor = await prisma.donor.create({
      data: {
        ...donorData,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Add interest domains if provided
    if (interestDomains && Array.isArray(interestDomains)) {
      for (const domain of interestDomains) {
        // Find or create the interest domain
        const interestDomain = await prisma.interestDomain.upsert({
          where: { name: domain.name },
          update: {},
          create: {
            name: domain.name,
            description: domain.description
          }
        });
        
        // Create the relationship
        await prisma.donorInterestDomain.create({
          data: {
            donor_id: donor.id,
            interest_domain_id: interestDomain.id,
            level: domain.level || 1
          }
        });
      }
    }
    
    // Get the complete donor with relationships
    const donorWithRelations = await prisma.donor.findUnique({
      where: { id: donor.id },
      include: {
        interest_domains: {
          include: {
            interest_domain: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    res.status(201).json(donorWithRelations);
  } catch (error) {
    next(error);
  }
};

// Get all donors (non-deleted)
export const getDonors = async (req, res, next) => {
  try {
    const donors = await prisma.donor.findMany({
      where: {
        is_deleted: false
      },
      include: {
        last_donation: true,
        tags: {
          include: {
            tag: true
          }
        },
        interest_domains: {
          include: {
            interest_domain: true
          }
        }
      }
    });
    
    res.status(200).json(donors);
  } catch (error) {
    next(error);
  }
};

// Get donor by ID
export const getDonorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        last_donation: true,
        tags: {
          include: {
            tag: true
          }
        },
        interest_domains: {
          include: {
            interest_domain: true
          }
        },
        donations: {
          include: {
            donation: true
          }
        },
        communications: true
      }
    });
    
    if (!donor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (donor.is_deleted) {
      return next(errorHandler(410, "Donor has been deleted"));
    }
    
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

// Update donor
export const updateDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const donorData = req.body;
    
    // Check if donor exists and is not deleted
    const existingDonor = await prisma.donor.findUnique({
      where: { id }
    });
    
    if (!existingDonor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (existingDonor.is_deleted) {
      return next(errorHandler(410, "Cannot update a deleted donor"));
    }
    
    // Handle interest domains if provided
    let interestDomains;
    if (donorData.interest_domains) {
      interestDomains = donorData.interest_domains;
      delete donorData.interest_domains;
    }
    
    // Update the donor
    const donor = await prisma.donor.update({
      where: { id },
      data: {
        ...donorData,
        updated_at: new Date()
      }
    });
    
    // Update interest domains if provided
    if (interestDomains && Array.isArray(interestDomains)) {
      // Remove existing interest domains
      await prisma.donorInterestDomain.deleteMany({
        where: { donor_id: id }
      });
      
      // Add new interest domains
      for (const domain of interestDomains) {
        // Find or create the interest domain
        const interestDomain = await prisma.interestDomain.upsert({
          where: { name: domain.name },
          update: {},
          create: {
            name: domain.name,
            description: domain.description
          }
        });
        
        // Create the relationship
        await prisma.donorInterestDomain.create({
          data: {
            donor_id: donor.id,
            interest_domain_id: interestDomain.id,
            level: domain.level || 1
          }
        });
      }
    }
    
    // Get the updated donor with relationships
    const donorWithRelations = await prisma.donor.findUnique({
      where: { id: donor.id },
      include: {
        interest_domains: {
          include: {
            interest_domain: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    res.status(200).json(donorWithRelations);
  } catch (error) {
    next(error);
  }
};

// Soft delete donor
export const deleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if donor exists and is not already deleted
    const existingDonor = await prisma.donor.findUnique({
      where: { id }
    });
    
    if (!existingDonor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (existingDonor.is_deleted) {
      return next(errorHandler(410, "Donor is already deleted"));
    }
    
    // Soft delete the donor
    await prisma.donor.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    });
    
    res.status(200).json({ message: "Donor deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Hard delete donor (for admin use only)
export const hardDeleteDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.donor.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Donor permanently deleted" });
  } catch (error) {
    next(error);
  }
};

// Restore a soft-deleted donor
export const restoreDonor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if donor exists and is deleted
    const existingDonor = await prisma.donor.findUnique({
      where: { id }
    });
    
    if (!existingDonor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (!existingDonor.is_deleted) {
      return next(errorHandler(400, "Donor is not deleted"));
    }
    
    // Restore the donor
    await prisma.donor.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null
      }
    });
    
    res.status(200).json({ message: "Donor restored successfully" });
  } catch (error) {
    next(error);
  }
};

// Add donation to donor
export const addDonationToDonor = async (req, res, next) => {
  try {
    const { donorId, donationId, amount, isPrimary } = req.body;
    
    if (!donorId || !donationId || !amount) {
      return next(errorHandler(400, "Donor ID, donation ID, and amount are required"));
    }
    
    // Check if donor and donation exist
    const donor = await prisma.donor.findUnique({
      where: { id: donorId }
    });
    
    if (!donor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (donor.is_deleted) {
      return next(errorHandler(410, "Cannot add donation to a deleted donor"));
    }
    
    const donation = await prisma.donation.findUnique({
      where: { id: donationId }
    });
    
    if (!donation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    // Create the relationship
    const donorDonation = await prisma.donorDonation.create({
      data: {
        donor_id: donorId,
        donation_id: donationId,
        amount: parseFloat(amount),
        is_primary: isPrimary !== undefined ? isPrimary : true
      },
      include: {
        donation: true
      }
    });
    
    // Update donor's total donation amount and count
    await prisma.donor.update({
      where: { id: donorId },
      data: {
        total_donation_amount: {
          increment: parseFloat(amount)
        },
        total_donations_count: {
          increment: 1
        },
        last_donation_id: donationId
      }
    });
    
    res.status(201).json(donorDonation);
  } catch (error) {
    next(error);
  }
};

// Add tag to donor
export const addTagToDonor = async (req, res, next) => {
  try {
    const { donorId, tagId } = req.body;
    
    // Check if donor and tag exist
    const donor = await prisma.donor.findUnique({
      where: { id: donorId }
    });
    
    if (!donor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (donor.is_deleted) {
      return next(errorHandler(410, "Cannot add tag to a deleted donor"));
    }
    
    const tag = await prisma.tag.findUnique({
      where: { id: tagId }
    });
    
    if (!tag) {
      return next(errorHandler(404, "Tag not found"));
    }
    
    // Check if the relationship already exists
    const existingDonorTag = await prisma.donorTag.findUnique({
      where: {
        donor_id_tag_id: {
          donor_id: donorId,
          tag_id: tagId
        }
      }
    });
    
    if (existingDonorTag) {
      return next(errorHandler(400, "Donor already has this tag"));
    }
    
    // Create the relationship
    const donorTag = await prisma.donorTag.create({
      data: {
        donor_id: donorId,
        tag_id: tagId
      },
      include: {
        tag: true
      }
    });
    
    res.status(201).json(donorTag);
  } catch (error) {
    next(error);
  }
};

// Remove tag from donor
export const removeTagFromDonor = async (req, res, next) => {
  try {
    const { donorId, tagId } = req.params;
    
    // Check if the relationship exists
    const donorTag = await prisma.donorTag.findUnique({
      where: {
        donor_id_tag_id: {
          donor_id: donorId,
          tag_id: tagId
        }
      }
    });
    
    if (!donorTag) {
      return next(errorHandler(404, "Donor does not have this tag"));
    }
    
    // Delete the relationship
    await prisma.donorTag.delete({
      where: {
        donor_id_tag_id: {
          donor_id: donorId,
          tag_id: tagId
        }
      }
    });
    
    res.status(200).json({ message: "Tag removed from donor successfully" });
  } catch (error) {
    next(error);
  }
};

// Add interest domain to donor
export const addInterestDomainToDonor = async (req, res, next) => {
  try {
    const { donorId, interestDomainId, level } = req.body;
    
    if (!donorId || !interestDomainId) {
      return next(errorHandler(400, "Donor ID and interest domain ID are required"));
    }
    
    // Check if donor and interest domain exist
    const donor = await prisma.donor.findUnique({
      where: { id: donorId }
    });
    
    if (!donor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (donor.is_deleted) {
      return next(errorHandler(410, "Cannot add interest domain to a deleted donor"));
    }
    
    const interestDomain = await prisma.interestDomain.findUnique({
      where: { id: interestDomainId }
    });
    
    if (!interestDomain) {
      return next(errorHandler(404, "Interest domain not found"));
    }
    
    // Check if the relationship already exists
    const existingDonorInterestDomain = await prisma.donorInterestDomain.findUnique({
      where: {
        donor_id_interest_domain_id: {
          donor_id: donorId,
          interest_domain_id: interestDomainId
        }
      }
    });
    
    if (existingDonorInterestDomain) {
      // Update the existing relationship if level is different
      if (level && existingDonorInterestDomain.level !== level) {
        const updatedDonorInterestDomain = await prisma.donorInterestDomain.update({
          where: {
            donor_id_interest_domain_id: {
              donor_id: donorId,
              interest_domain_id: interestDomainId
            }
          },
          data: {
            level: level
          },
          include: {
            interest_domain: true
          }
        });
        
        return res.status(200).json(updatedDonorInterestDomain);
      }
      
      return next(errorHandler(400, "Donor already has this interest domain"));
    }
    
    // Create the relationship
    const donorInterestDomain = await prisma.donorInterestDomain.create({
      data: {
        donor_id: donorId,
        interest_domain_id: interestDomainId,
        level: level || 1
      },
      include: {
        interest_domain: true
      }
    });
    
    res.status(201).json(donorInterestDomain);
  } catch (error) {
    next(error);
  }
};

// Remove interest domain from donor
export const removeInterestDomainFromDonor = async (req, res, next) => {
  try {
    const { donorId, interestDomainId } = req.params;
    
    // Check if the relationship exists
    const donorInterestDomain = await prisma.donorInterestDomain.findUnique({
      where: {
        donor_id_interest_domain_id: {
          donor_id: donorId,
          interest_domain_id: interestDomainId
        }
      }
    });
    
    if (!donorInterestDomain) {
      return next(errorHandler(404, "Donor does not have this interest domain"));
    }
    
    // Delete the relationship
    await prisma.donorInterestDomain.delete({
      where: {
        donor_id_interest_domain_id: {
          donor_id: donorId,
          interest_domain_id: interestDomainId
        }
      }
    });
    
    res.status(200).json({ message: "Interest domain removed from donor successfully" });
  } catch (error) {
    next(error);
  }
}; 