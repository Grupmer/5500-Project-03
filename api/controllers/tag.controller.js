import { PrismaClient } from "@prisma/client";
import { errorHandler } from "../utils/error.js";

const prisma = new PrismaClient();

// Create a new tag
export const createTag = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) {
      return next(errorHandler(400, "Tag name is required"));
    }
    
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    });
    
    if (existingTag) {
      return next(errorHandler(400, "Tag with this name already exists"));
    }
    
    const tag = await prisma.tag.create({
      data: { 
        name,
        description,
        color,
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    res.status(201).json(tag);
  } catch (error) {
    next(error);
  }
};

// Get all tags (non-deleted)
export const getTags = async (req, res, next) => {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        is_deleted: false
      }
    });
    
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
};

// Get tag by ID
export const getTagById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const tag = await prisma.tag.findUnique({
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
    
    if (!tag) {
      return next(errorHandler(404, "Tag not found"));
    }
    
    if (tag.is_deleted) {
      return next(errorHandler(410, "Tag has been deleted"));
    }
    
    // Filter out deleted donors from the response
    tag.donors = tag.donors.filter(dt => !dt.donor.is_deleted);
    
    res.status(200).json(tag);
  } catch (error) {
    next(error);
  }
};

// Update tag
export const updateTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    // Check if tag exists and is not deleted
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });
    
    if (!existingTag) {
      return next(errorHandler(404, "Tag not found"));
    }
    
    if (existingTag.is_deleted) {
      return next(errorHandler(410, "Cannot update a deleted tag"));
    }
    
    if (!name) {
      return next(errorHandler(400, "Tag name is required"));
    }
    
    // Check if another tag with the same name exists
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name,
        id: { not: id },
        is_deleted: false
      }
    });
    
    if (duplicateTag) {
      return next(errorHandler(400, "Tag with this name already exists"));
    }
    
    const tag = await prisma.tag.update({
      where: { id },
      data: { 
        name,
        description: description !== undefined ? description : undefined,
        color: color !== undefined ? color : undefined,
        updated_at: new Date()
      }
    });
    
    res.status(200).json(tag);
  } catch (error) {
    next(error);
  }
};

// Soft delete tag
export const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists and is not already deleted
    const existingTag = await prisma.tag.findUnique({
      where: { id },
      include: {
        donors: true
      }
    });
    
    if (!existingTag) {
      return next(errorHandler(404, "Tag not found"));
    }
    
    if (existingTag.is_deleted) {
      return next(errorHandler(410, "Tag is already deleted"));
    }
    
    // Soft delete the tag
    await prisma.tag.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    });
    
    res.status(200).json({ message: "Tag deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Hard delete tag (for admin use only)
export const hardDeleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if any donors are using this tag
    const tagUsage = await prisma.donorTag.findMany({
      where: { tag_id: id }
    });
    
    if (tagUsage.length > 0) {
      return next(errorHandler(400, `Cannot delete tag that is used by ${tagUsage.length} donors. Remove all associations first.`));
    }
    
    await prisma.tag.delete({
      where: { id }
    });
    
    res.status(200).json({ message: "Tag permanently deleted" });
  } catch (error) {
    next(error);
  }
};

// Restore a soft-deleted tag
export const restoreTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if tag exists and is deleted
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });
    
    if (!existingTag) {
      return next(errorHandler(404, "Tag not found"));
    }
    
    if (!existingTag.is_deleted) {
      return next(errorHandler(400, "Tag is not deleted"));
    }
    
    // Check if the name conflicts with any active tags now
    const duplicateTag = await prisma.tag.findFirst({
      where: {
        name: existingTag.name,
        id: { not: id },
        is_deleted: false
      }
    });
    
    if (duplicateTag) {
      return next(errorHandler(400, "Cannot restore tag: a tag with this name already exists"));
    }
    
    // Restore the tag
    await prisma.tag.update({
      where: { id },
      data: {
        is_deleted: false,
        deleted_at: null
      }
    });
    
    res.status(200).json({ message: "Tag restored successfully" });
  } catch (error) {
    next(error);
  }
}; 