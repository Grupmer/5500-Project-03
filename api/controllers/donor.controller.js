import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {errorHandler} from "../utils/error.js";
import csv from 'csv-parser';
import { Readable } from 'stream';

const prisma = new PrismaClient();

export const createDonor = async (req, res, next) => {
  try {
    if (!req.user) {
      const err = new Error('Unauthorized: Please log in');
      err.statusCode = 401;
      err.isPublic = true;
      return next(err);
    }

    const {
      first_name,
      nick_name,
      last_name,
      organization_name,
      unit_number,
      street_address,
      city,
      total_donations,
      total_pledge,
      largest_gift_amount,
      largest_gift_appeal,
      last_gift_amount,
      last_gift_request,
      last_gift_appeal,
      first_gift_date,
      pmm,
      exclude,
      deceased,
      contact_phone_type,
      phone_restrictions,
      email_restrictions,
      communication_restrictions,
      subscription_events_in_person,
      subscription_events_magazine,
      communication_preference,
      tagIds = []
    } = req.body;

    if (!pmm) {
      const err = new Error('PMM is required');
      err.statusCode = 400;
      err.isPublic = true;
      return next(err);
    }

    //Check for existing donor
    const existingDonor = await prisma.donor.findFirst({
      where: {
        first_name,
        last_name,
        organization_name,
        street_address
      }
    });

    if (existingDonor) {
      const err = new Error('Donor already exists with the same name and address.');
      err.statusCode = 409;
      err.isPublic = true;
      return next(err);
    }

    const newDonor = await prisma.donor.create({
      data: {
        first_name,
        nick_name: nick_name || null,
        last_name,
        organization_name: organization_name || null,
        unit_number: unit_number || null,
        street_address,
        city,
        total_donation_amount: total_donation_amount || 0,
        total_pledge: total_pledge || null,
        largest_gift_amount: largest_gift_amount || null,
        largest_gift_appeal: largest_gift_appeal || null,
        last_gift_amount: last_gift_amount || null,
        last_gift_request: last_gift_request || null,
        last_gift_appeal: last_gift_appeal || null,
        first_gift_date: first_gift_date || null,
        pmm,
        exclude: exclude ?? false,
        deceased: deceased ?? false,
        contact_phone_type: contact_phone_type || null,
        phone_restrictions: phone_restrictions || null,
        email_restrictions: email_restrictions || null,
        communication_restrictions: communication_restrictions || null,
        subscription_events_in_person: subscription_events_in_person || null,
        subscription_events_magazine: subscription_events_magazine || null,
        communication_preference: communication_preference || null,
        tags: tagIds.length > 0
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: 'Donor created successfully',
      donor: newDonor
    });

  } catch (error) {
    console.error("Error creating donor:", error);
    next(error); 
  }
};



// function to get all donors
export const getAllDonors = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }

    const donors = await prisma.donor.findMany({
      where: { is_deleted: false },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        organization_name: true,
        city: true,
        pmm: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      message: "Donors fetched successfully",
      donors
    });
  } catch (error) {
    console.error("Error fetching all donors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donors",
      error: error.message
    });
  }
};

// function to get donors with search, pagination, filters, and pmm search
export const getDonors = async (req, res, next) => {
  try {
    if (!req.user) return next(errorHandler(401, 'Unauthorized: Please log in'));

    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      minDonationAmount,
      maxDonationAmount,
      tags,
      city,
      pmm
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let whereClause = { is_deleted: false };

    // city filter allow multiple cities
    if (city) {
      const cities = Array.isArray(city) ? city : [city];
      whereClause.city = { in: cities };
    }

    // pmm filter (partial match)
    if (pmm) {
      whereClause.pmm = { contains: pmm };
    }

    // Donation filter
    if (minDonationAmount !== undefined || maxDonationAmount !== undefined) {
      whereClause.total_donation_amount = {};
      if (minDonationAmount !== undefined) {
        whereClause.total_donation_amount.gte = parseFloat(minDonationAmount);
      }
      if (maxDonationAmount !== undefined) {
        whereClause.total_donation_amount.lte = parseFloat(maxDonationAmount);
      }
    }

    // Tags filter
    const tagsFilter = tags
      ? {
          tags: {
            some: {
              tag: {
                name: {
                  in: Array.isArray(tags) ? tags : [tags]
                }
              }
            }
          }
        }
      : {};

    // Search filter
    let searchFilter = {};
    if (search) {
      searchFilter = {
        OR: [
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { organization_name: { contains: search } }
        ]
      };
    }

    const finalWhere = {
      ...whereClause,
      ...tagsFilter,
      ...searchFilter
    };

    const totalDonors = await prisma.donor.count({
      where: finalWhere 
    });

    const donors = await prisma.donor.findMany({
      where: finalWhere,
      include: {
        tags: { include: { tag: true } },
        events: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limitNum
    });

    res.status(200).json({
      donors,
      pagination: {
        total: totalDonors,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalDonors / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};




export const getDonorById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const { id } = req.params;

    const donor = await prisma.donor.findUnique({
      where: { id },
      include: {
        tags: { include: { tag: true } },
        interest_domains: { include: { interest_domain: true } },
        events: true
      }
    });

    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    res.status(200).json(donor);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donor', error: error.message });
  }
};

export const updateDonor = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const { id } = req.params;
    const updateData = req.body;

    const existingDonor = await prisma.donor.findUnique({ where: { id } });
    if (!existingDonor || existingDonor.is_deleted)
      return res.status(404).json({ message: 'Donor not found' });

    const updatedDonor = await prisma.donor.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ message: 'Donor updated successfully', donor: updatedDonor });
  } catch (error) {
    console.error('Error updating donor:', error);
    res.status(500).json({ message: 'Error updating donor', error: error.message });
  }
};

export const deleteDonor = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const { id } = req.params;
    const existingDonor = await prisma.donor.findUnique({ where: { id } });
    if (!existingDonor || existingDonor.is_deleted)
      return res.status(404).json({ message: 'Donor not found' });

    await prisma.donor.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date() }
    });

    res.status(200).json({ message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ message: 'Error deleting donor', error: error.message });
  }
};

// function to import donors from CSV with update or create logic
export const importDonorsCsv = async (req, res, next) => {
  try {
    if (!req.user) return next(errorHandler(401, 'Unauthorized: Please log in'));
    if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

    const results = [];
    const errors = [];

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve());
    });

    const parseDate = (value) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    const normalizeCity = (cityName) => cityName?.replaceAll(' ', '_');
    const normalizeEnum = (value) => value?.trim()?.replace(/\s+/g, '_').replace(/-/g, '_') || null;

    const importedDonors = [];
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of results) {
      try {
        const donorData = {
          first_name: row.first_name,
          nick_name: row.nick_name || null,
          last_name: row.last_name,
          organization_name: row.organization_name || null,
          unit_number: row.address_line2 || null,
          street_address: row.address_line1,
          city: normalizeCity(row.city),
          total_donation_amount: parseFloat(row.total_donations) || 0,
          total_pledge: row.total_pledge ? parseFloat(row.total_pledge) : null,
          largest_gift_amount: row.largest_gift_amount ? parseFloat(row.largest_gift_amount) : null,
          largest_gift_appeal: row.largest_gift_appeal || null,
          last_gift_amount: row.last_gift_amount ? parseFloat(row.last_gift_amount) : null,
          last_gift_request: row.last_gift_request || null,
          last_gift_appeal: row.last_gift_appeal || null,
          first_gift_date: parseDate(row.first_gift_date),
          last_gift_date: parseDate(row.last_gift_date),
          pmm: row.pmm,
          exclude: row.exclude === 'true',
          deceased: row.deceased === 'true',
          contact_phone_type: normalizeEnum(row.contact_phone_type),
          phone_restrictions: row.phone_restrictions || null,
          email_restrictions: row.email_restrictions || null,
          communication_restrictions: row.communication_restrictions || null,
          subscription_events_in_person: normalizeEnum(row.subscription_events_in_person),
          subscription_events_magazine: normalizeEnum(row.subscription_events_magazine),
          communication_preference: normalizeEnum(row.communication_preference),
          is_deleted: false,
          deleted_at: null
        };

        // First try to find an active donor
        let existingDonor = await prisma.donor.findFirst({
          where: {
            first_name: donorData.first_name,
            last_name: donorData.last_name,
            organization_name: donorData.organization_name,
            street_address: donorData.street_address,
            is_deleted: false
          }
        });

        // If no active donor found, look for a deleted one
        if (!existingDonor) {
          existingDonor = await prisma.donor.findFirst({
            where: {
              first_name: donorData.first_name,
              last_name: donorData.last_name,
              organization_name: donorData.organization_name,
              street_address: donorData.street_address,
              is_deleted: true
            }
          });
        }

        if (existingDonor) {
          // Update the donor (this will also restore if it was deleted)
          const updatedDonor = await prisma.donor.update({
            where: { id: existingDonor.id },
            data: donorData
          });
          importedDonors.push(updatedDonor);
          updatedCount++;
        } else {
          const newDonor = await prisma.donor.create({ data: donorData });
          importedDonors.push(newDonor);
          createdCount++;
        }
      } catch (error) {
        errors.push(`Row ${results.indexOf(row) + 1}: ${error.message}`);
      }
    }

    res.status(200).json({
      message: 'Donors imported successfully',
      createdCount,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing donors from CSV:', error);
    next(error);
  }
};

export const recommendDonors = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }

    const { tagIds = [], count = 10 } = req.body;
    
    if (tagIds.length === 0) {
      const topDonors = await prisma.donor.findMany({
        where: {
          exclude: false,
          deceased: false
        },
        orderBy: {
          total_donation_amount: 'desc'
        },
        take: count,
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
      
      const formattedDonors = topDonors.map(donor => ({
        value: donor.id,
        label: donor.organization_name || `${donor.first_name} ${donor.last_name}`,
        tags: donor.tags.map(t => t.tag),
        totalDonation: donor.total_donation_amount || 0,
        city: donor.city
      }));
      
      return res.status(200).json({ donors: formattedDonors });
    }
    
    const donorsWithTags = await prisma.donor.findMany({
      where: {
        exclude: false,
        deceased: false,
        tags: {
          some: {
            tag_id: {
              in: tagIds
            }
          }
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    const scoredDonors = donorsWithTags.map(donor => {
      const matchingTagCount = donor.tags.filter(t => 
        tagIds.includes(t.tagId)
      ).length;
      
      return {
        donor,
        score: matchingTagCount + (donor.total_donation_amount / 10000 || 0)
      };
    });
    
    const recommendedDonors = scoredDonors
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(item => ({
        value: item.donor.id,
        label: item.donor.organization_name || `${item.donor.first_name} ${item.donor.last_name}`,
        tags: item.donor.tags.map(t => t.tag),
        totalDonation: item.donor.total_donation_amount || 0,
        city: item.donor.city
      }));
    
    res.status(200).json({ donors: recommendedDonors });
  } catch (error) {
    next(errorHandler(error));
  }
};
