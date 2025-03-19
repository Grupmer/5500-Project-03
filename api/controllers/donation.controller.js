import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

// Create a new donation
export const createDonation = async (req, res, next) => {
  try {
    const { 
      amount, 
      donation_date, 
      donation_type, 
      payment_method, 
      status, 
      campaign_id,
      event_id, 
      notes,
      is_anonymous,
      donors
    } = req.body;
    
    // Validate required fields
    if (!amount || !donation_date) {
      return next(errorHandler(400, "Amount and donation date are required"));
    }
    
    // Create the donation
    const donation = await prisma.donation.create({
      data: {
        amount: parseFloat(amount),
        donation_date: new Date(donation_date),
        donation_type,
        payment_method,
        status,
        campaign_id,
        event_id,
        notes,
        is_anonymous: is_anonymous || false,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // If donors are specified, create relationships and update donors
    if (donors && Array.isArray(donors) && donors.length > 0) {
      for (const donorData of donors) {
        const { donor_id, amount: donorAmount, is_primary } = donorData;
        
        if (!donor_id || !donorAmount) {
          continue; // Skip invalid donor records
        }
        
        const donor = await prisma.donor.findUnique({
          where: { id: donor_id }
        });
        
        if (!donor || donor.is_deleted) {
          continue; // Skip non-existent or deleted donors
        }
        
        // Create donor-donation relationship
        await prisma.donorDonation.create({
          data: {
            donor_id,
            donation_id: donation.id,
            amount: parseFloat(donorAmount),
            is_primary: is_primary !== undefined ? is_primary : donors.length === 1
          }
        });
        
        // Update donor stats
        await prisma.donor.update({
          where: { id: donor_id },
          data: {
            total_donation_amount: {
              increment: parseFloat(donorAmount)
            },
            total_donations_count: {
              increment: 1
            },
            last_donation_id: donation.id
          }
        });
      }
    }
    
    // Return the complete donation with relationships
    const donationWithRelations = await prisma.donation.findUnique({
      where: { id: donation.id },
      include: {
        donors: {
          include: {
            donor: true
          }
        }
      }
    });
    
    res.status(201).json(donationWithRelations);
  } catch (error) {
    next(error);
  }
};

// Get all donations (non-deleted)
export const getDonations = async (req, res, next) => {
  try {
    const donations = await prisma.donation.findMany({
      where: {
        is_deleted: false
      },
      include: {
        donors: {
          include: {
            donor: true
          }
        }
      }
    });
    
    res.status(200).json(donations);
  } catch (error) {
    next(error);
  }
};

// Get donation by ID
export const getDonationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: {
          include: {
            donor: true
          }
        },
        donorsLastDonation: true
      }
    });
    
    if (!donation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    if (donation.is_deleted) {
      return next(errorHandler(410, "Donation has been deleted"));
    }
    
    res.status(200).json(donation);
  } catch (error) {
    next(error);
  }
};

// Update donation
export const updateDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      donation_date, 
      donation_type, 
      payment_method, 
      status, 
      campaign_id,
      event_id, 
      notes,
      is_anonymous,
      donors
    } = req.body;
    
    // Check if donation exists and is not deleted
    const existingDonation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: true
      }
    });
    
    if (!existingDonation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    if (existingDonation.is_deleted) {
      return next(errorHandler(410, "Cannot update a deleted donation"));
    }
    
    // Update the donation
    const donation = await prisma.donation.update({
      where: { id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        donation_date: donation_date ? new Date(donation_date) : undefined,
        donation_type: donation_type !== undefined ? donation_type : undefined,
        payment_method: payment_method !== undefined ? payment_method : undefined,
        status: status !== undefined ? status : undefined,
        campaign_id: campaign_id !== undefined ? campaign_id : undefined,
        event_id: event_id !== undefined ? event_id : undefined,
        notes: notes !== undefined ? notes : undefined,
        is_anonymous: is_anonymous !== undefined ? is_anonymous : undefined,
        updated_at: new Date()
      }
    });
    
    // If amount changed, update the donors' totals
    if (amount && parseFloat(amount) !== parseFloat(existingDonation.amount)) {
      const amountDifference = parseFloat(amount) - parseFloat(existingDonation.amount);
      
      // Update all donors with a proportional adjustment to their totals
      const donorDonations = await prisma.donorDonation.findMany({
        where: { donation_id: id }
      });
      
      for (const donorDonation of donorDonations) {
        // Calculate proportional adjustment
        const donorShare = parseFloat(donorDonation.amount) / parseFloat(existingDonation.amount);
        const donorAdjustment = amountDifference * donorShare;
        
        // Update donor donation record
        await prisma.donorDonation.update({
          where: {
            donor_id_donation_id: {
              donor_id: donorDonation.donor_id,
              donation_id: id
            }
          },
          data: {
            amount: parseFloat(donorDonation.amount) + donorAdjustment
          }
        });
        
        // Update donor total
        await prisma.donor.update({
          where: { id: donorDonation.donor_id },
          data: {
            total_donation_amount: {
              increment: donorAdjustment
            }
          }
        });
      }
    }
    
    // If donors are provided, update the donor relationships
    if (donors && Array.isArray(donors)) {
      // Get existing donor relationships
      const existingDonorDonations = await prisma.donorDonation.findMany({
        where: { donation_id: id }
      });
      
      const existingDonorIds = existingDonorDonations.map(dd => dd.donor_id);
      const newDonorIds = donors.map(d => d.donor_id);
      
      // Remove donors that are no longer associated
      for (const existingDonorId of existingDonorIds) {
        if (!newDonorIds.includes(existingDonorId)) {
          const donorDonation = existingDonorDonations.find(dd => dd.donor_id === existingDonorId);
          
          // Update donor stats
          await prisma.donor.update({
            where: { id: existingDonorId },
            data: {
              total_donation_amount: {
                decrement: parseFloat(donorDonation.amount)
              },
              total_donations_count: {
                decrement: 1
              },
              // Clear last_donation_id if it matches this donation
              last_donation_id: {
                set: donation.id === donorDonation.last_donation_id ? null : undefined
              }
            }
          });
          
          // Delete the relationship
          await prisma.donorDonation.delete({
            where: {
              donor_id_donation_id: {
                donor_id: existingDonorId,
                donation_id: id
              }
            }
          });
        }
      }
      
      // Add or update donors
      for (const donorData of donors) {
        const { donor_id, amount: donorAmount, is_primary } = donorData;
        
        if (!donor_id || !donorAmount) {
          continue; // Skip invalid donor records
        }
        
        const donor = await prisma.donor.findUnique({
          where: { id: donor_id }
        });
        
        if (!donor || donor.is_deleted) {
          continue; // Skip non-existent or deleted donors
        }
        
        // Check if relationship already exists
        const existingDonorDonation = existingDonorDonations.find(dd => dd.donor_id === donor_id);
        
        if (existingDonorDonation) {
          // Update existing relationship if amount changed
          if (parseFloat(donorAmount) !== parseFloat(existingDonorDonation.amount)) {
            const amountDifference = parseFloat(donorAmount) - parseFloat(existingDonorDonation.amount);
            
            await prisma.donorDonation.update({
              where: {
                donor_id_donation_id: {
                  donor_id,
                  donation_id: id
                }
              },
              data: {
                amount: parseFloat(donorAmount),
                is_primary: is_primary !== undefined ? is_primary : existingDonorDonation.is_primary
              }
            });
            
            // Update donor stats
            await prisma.donor.update({
              where: { id: donor_id },
              data: {
                total_donation_amount: {
                  increment: amountDifference
                }
              }
            });
          }
        } else {
          // Create new relationship
          await prisma.donorDonation.create({
            data: {
              donor_id,
              donation_id: id,
              amount: parseFloat(donorAmount),
              is_primary: is_primary !== undefined ? is_primary : false
            }
          });
          
          // Update donor stats
          await prisma.donor.update({
            where: { id: donor_id },
            data: {
              total_donation_amount: {
                increment: parseFloat(donorAmount)
              },
              total_donations_count: {
                increment: 1
              },
              // Set as last donation if newer than current last donation
              last_donation_id: donation.donation_date > (donor.last_donation?.donation_date || new Date(0)) 
                ? donation.id 
                : undefined
            }
          });
        }
      }
    }
    
    // Return the updated donation with relationships
    const updatedDonation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: {
          include: {
            donor: true
          }
        },
        donorsLastDonation: true
      }
    });
    
    res.status(200).json(updatedDonation);
  } catch (error) {
    next(error);
  }
};

// Soft delete donation
export const deleteDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if donation exists and is not already deleted
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: true,
        donorsLastDonation: true
      }
    });
    
    if (!donation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    if (donation.is_deleted) {
      return next(errorHandler(410, "Donation is already deleted"));
    }
    
    // Update any donors that have this as their last donation
    if (donation.donorsLastDonation.length > 0) {
      for (const donor of donation.donorsLastDonation) {
        // Find the most recent donation for this donor that is not the one being deleted
        const latestDonation = await prisma.donorDonation.findFirst({
          where: {
            donor_id: donor.id,
            donation_id: { not: id }
          },
          include: {
            donation: true
          },
          orderBy: {
            donation: {
              donation_date: 'desc'
            }
          }
        });
        
        await prisma.donor.update({
          where: { id: donor.id },
          data: {
            last_donation_id: latestDonation ? latestDonation.donation_id : null
          }
        });
      }
    }
    
    // Update donor totals
    for (const donorDonation of donation.donors) {
      await prisma.donor.update({
        where: { id: donorDonation.donor_id },
        data: {
          total_donation_amount: {
            decrement: parseFloat(donorDonation.amount)
          },
          total_donations_count: {
            decrement: 1
          }
        }
      });
    }
    
    // Soft delete the donation
    await prisma.donation.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    });
    
    res.status(200).json({ message: "Donation deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Hard delete donation (for admin use only)
export const hardDeleteDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if donation exists
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: true,
        donorsLastDonation: true
      }
    });
    
    if (!donation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    // Update any donors that have this as their last donation
    if (donation.donorsLastDonation.length > 0) {
      for (const donor of donation.donorsLastDonation) {
        // Find the most recent donation for this donor that is not the one being deleted
        const latestDonation = await prisma.donorDonation.findFirst({
          where: {
            donor_id: donor.id,
            donation_id: { not: id }
          },
          include: {
            donation: true
          },
          orderBy: {
            donation: {
              donation_date: 'desc'
            }
          }
        });
        
        await prisma.donor.update({
          where: { id: donor.id },
          data: {
            last_donation_id: latestDonation ? latestDonation.donation_id : null
          }
        });
      }
    }
    
    // Update donor totals
    for (const donorDonation of donation.donors) {
      await prisma.donor.update({
        where: { id: donorDonation.donor_id },
        data: {
          total_donation_amount: {
            decrement: parseFloat(donorDonation.amount)
          },
          total_donations_count: {
            decrement: 1
          }
        }
      });
    }
    
    // Permanently delete the donation
    await prisma.donation.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Donation permanently deleted" });
  } catch (error) {
    next(error);
  }
};

// Restore a soft-deleted donation
export const restoreDonation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if donation exists and is deleted
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        donors: true
      }
    });
    
    if (!donation) {
      return next(errorHandler(404, "Donation not found"));
    }
    
    if (!donation.is_deleted) {
      return next(errorHandler(400, "Donation is not deleted"));
    }
    
    // Restore the donation
    await prisma.donation.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null
      }
    });
    
    // Restore donor totals and possibly last_donation references
    for (const donorDonation of donation.donors) {
      const donor = await prisma.donor.findUnique({
        where: { id: donorDonation.donor_id }
      });
      
      if (!donor || donor.is_deleted) {
        continue; // Skip deleted donors
      }
      
      // Update donor stats
      await prisma.donor.update({
        where: { id: donorDonation.donor_id },
        data: {
          total_donation_amount: {
            increment: parseFloat(donorDonation.amount)
          },
          total_donations_count: {
            increment: 1
          },
          // Update last_donation if this donation is more recent
          last_donation_id: donation.donation_date > (donor.last_donation?.donation_date || new Date(0)) 
            ? donation.id 
            : undefined
        }
      });
    }
    
    res.status(200).json({ message: "Donation restored successfully" });
  } catch (error) {
    next(error);
  }
}; 