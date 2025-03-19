import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

// Create a new interest domain
export const createInterestDomain = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return next(errorHandler(400, "Interest domain name is required"));
    }
    
    const existingDomain = await prisma.interestDomain.findUnique({
      where: { name }
    });
    
    if (existingDomain) {
      return next(errorHandler(400, "Interest domain with this name already exists"));
    }
    
    const interestDomain = await prisma.interestDomain.create({
      data: {
        name,
        description,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    res.status(201).json(interestDomain);
  } catch (error) {
    next(error);
  }
};

// Get all interest domains
export const getInterestDomains = async (req, res, next) => {
  try {
    const interestDomains = await prisma.interestDomain.findMany();
    
    res.status(200).json(interestDomains);
  } catch (error) {
    next(error);
  }
};

// Get interest domain by ID
export const getInterestDomainById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const interestDomain = await prisma.interestDomain.findUnique({
      where: { id },
      include: {
        donors: {
          include: {
            donor: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                organization_name: true,
                email: true,
                is_company: true,
                is_deleted: true
              }
            }
          }
        }
      }
    });
    
    if (!interestDomain) {
      return next(errorHandler(404, "Interest domain not found"));
    }
    
    // Filter out deleted donors from the response
    interestDomain.donors = interestDomain.donors.filter(did => !did.donor.is_deleted);
    
    res.status(200).json(interestDomain);
  } catch (error) {
    next(error);
  }
};

// Update interest domain
export const updateInterestDomain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return next(errorHandler(400, "Interest domain name is required"));
    }
    
    // Check if domain exists
    const existingDomain = await prisma.interestDomain.findUnique({
      where: { id }
    });
    
    if (!existingDomain) {
      return next(errorHandler(404, "Interest domain not found"));
    }
    
    // Check if another domain with the same name exists
    const duplicateDomain = await prisma.interestDomain.findFirst({
      where: {
        name,
        id: { not: id }
      }
    });
    
    if (duplicateDomain) {
      return next(errorHandler(400, "Interest domain with this name already exists"));
    }
    
    const interestDomain = await prisma.interestDomain.update({
      where: { id },
      data: {
        name,
        description: description !== undefined ? description : undefined,
        updated_at: new Date()
      }
    });
    
    res.status(200).json(interestDomain);
  } catch (error) {
    next(error);
  }
};

// Delete interest domain
export const deleteInterestDomain = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if domain exists
    const existingDomain = await prisma.interestDomain.findUnique({
      where: { id },
      include: {
        donors: true
      }
    });
    
    if (!existingDomain) {
      return next(errorHandler(404, "Interest domain not found"));
    }
    
    // Check if any donors are using this interest domain
    if (existingDomain.donors.length > 0) {
      return next(errorHandler(400, `Cannot delete interest domain that is used by ${existingDomain.donors.length} donors. Remove all associations first.`));
    }
    
    // Delete the interest domain
    await prisma.interestDomain.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Interest domain deleted successfully" });
  } catch (error) {
    next(error);
  }
}; 