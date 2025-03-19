import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

// Create a new communication
export const createCommunication = async (req, res, next) => {
  try {
    const {
      donor_id,
      type,
      direction,
      subject,
      content,
      status,
      communication_date,
      response_required,
      response_received,
      response_date,
      notes
    } = req.body;
    
    // Validate required fields
    if (!donor_id || !type || !direction || !status || !communication_date) {
      return next(errorHandler(400, "Donor ID, type, direction, status, and communication date are required"));
    }
    
    // Check if donor exists and is not deleted
    const donor = await prisma.donor.findUnique({
      where: { id: donor_id }
    });
    
    if (!donor) {
      return next(errorHandler(404, "Donor not found"));
    }
    
    if (donor.is_deleted) {
      return next(errorHandler(410, "Cannot add communication to a deleted donor"));
    }
    
    // Create the communication
    const communication = await prisma.communication.create({
      data: {
        donor_id,
        type,
        direction,
        subject,
        content,
        status,
        communication_date: new Date(communication_date),
        response_required: response_required !== undefined ? response_required : false,
        response_received: response_received !== undefined ? response_received : false,
        response_date: response_date ? new Date(response_date) : undefined,
        notes,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    res.status(201).json(communication);
  } catch (error) {
    next(error);
  }
};

// Get all communications
export const getCommunications = async (req, res, next) => {
  try {
    const { donor_id, type, direction, status, start_date, end_date } = req.query;
    
    // Build filters
    const filters = {};
    
    if (donor_id) {
      filters.donor_id = donor_id;
    }
    
    if (type) {
      filters.type = type;
    }
    
    if (direction) {
      filters.direction = direction;
    }
    
    if (status) {
      filters.status = status;
    }
    
    if (start_date || end_date) {
      filters.communication_date = {};
      
      if (start_date) {
        filters.communication_date.gte = new Date(start_date);
      }
      
      if (end_date) {
        filters.communication_date.lte = new Date(end_date);
      }
    }
    
    const communications = await prisma.communication.findMany({
      where: filters,
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
      },
      orderBy: {
        communication_date: 'desc'
      }
    });
    
    res.status(200).json(communications);
  } catch (error) {
    next(error);
  }
};

// Get communication by ID
export const getCommunicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        donor: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            organization_name: true,
            email: true,
            phone_number: true,
            is_company: true
          }
        }
      }
    });
    
    if (!communication) {
      return next(errorHandler(404, "Communication not found"));
    }
    
    res.status(200).json(communication);
  } catch (error) {
    next(error);
  }
};

// Update communication
export const updateCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      direction,
      subject,
      content,
      status,
      communication_date,
      response_required,
      response_received,
      response_date,
      notes
    } = req.body;
    
    // Check if communication exists
    const existingCommunication = await prisma.communication.findUnique({
      where: { id }
    });
    
    if (!existingCommunication) {
      return next(errorHandler(404, "Communication not found"));
    }
    
    // Update the communication
    const communication = await prisma.communication.update({
      where: { id },
      data: {
        type: type !== undefined ? type : undefined,
        direction: direction !== undefined ? direction : undefined,
        subject: subject !== undefined ? subject : undefined,
        content: content !== undefined ? content : undefined,
        status: status !== undefined ? status : undefined,
        communication_date: communication_date ? new Date(communication_date) : undefined,
        response_required: response_required !== undefined ? response_required : undefined,
        response_received: response_received !== undefined ? response_received : undefined,
        response_date: response_date ? new Date(response_date) : response_date === null ? null : undefined,
        notes: notes !== undefined ? notes : undefined,
        updated_at: new Date()
      }
    });
    
    res.status(200).json(communication);
  } catch (error) {
    next(error);
  }
};

// Delete communication
export const deleteCommunication = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if communication exists
    const existingCommunication = await prisma.communication.findUnique({
      where: { id }
    });
    
    if (!existingCommunication) {
      return next(errorHandler(404, "Communication not found"));
    }
    
    // Delete the communication
    await prisma.communication.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Communication deleted successfully" });
  } catch (error) {
    next(error);
  }
}; 