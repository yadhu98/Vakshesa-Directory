import { Request, Response } from 'express';
import { db } from '../config/storage';

// Get full family tree structure
export const getFamilyTree = async (req: Request, res: Response) => {
  try {
    let { familyId } = req.params;
    const { house } = req.query;

    // Build query based on parameters
    let query: any = {};
    
    if (familyId === 'family-default' && house) {
      // For family-default with house filter, query by house only
      query.house = house;
    } else if (familyId === 'family-default') {
      // For family-default without house filter, get users with family-default familyId
      query.familyId = 'family-default';
    } else {
      // For specific familyId, use it directly
      query.familyId = familyId;
      if (house) {
        query.house = house;
      }
    }

    let users = await db.find('users', query);

    // Exclude Super Admin from family tree (they don't have family relations)
    users = users.filter((user: any) => !user.isSuperUser);

    // Build tree structure
    const tree = buildTreeStructure(users);

    res.json({
      familyId: familyId === 'family-default' ? 'family-default' : familyId,
      house: house || 'all',
      totalMembers: users.length,
      totalGenerations: users.length > 0 ? Math.max(...users.map((u: any) => u.generation || 1)) : 0,
      tree,
    });
  } catch (error: any) {
    console.error('Get family tree error:', error);
    res.status(500).json({ message: 'Failed to fetch family tree', error: error.message });
  }
};

// Get specific member with their immediate family
export const getFamilyMember = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get immediate family members
    const immediateFamily = await getImmediateFamily(user);

    res.json({
      member: user,
      ...immediateFamily,
    });
  } catch (error: any) {
    console.error('Get family member error:', error);
    res.status(500).json({ message: 'Failed to fetch family member', error: error.message });
  }
};

// Update family relationships
export const updateFamilyRelationships = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { fatherId, motherId, spouseId, children } = req.body;

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    // Update father
    if (fatherId !== undefined) {
      if (fatherId) {
        const father = await db.findById('users', fatherId);
        if (!father) {
          return res.status(404).json({ message: 'Father not found' });
        }
        // Add this user to father's children
        if (!father.children) father.children = [];
        if (!father.children.includes(userId)) {
          await db.update('users', fatherId, {
            children: [...father.children, userId],
            updatedAt: new Date(),
          });
        }
      }
      updates.fatherId = fatherId || null;
    }

    // Update mother
    if (motherId !== undefined) {
      if (motherId) {
        const mother = await db.findById('users', motherId);
        if (!mother) {
          return res.status(404).json({ message: 'Mother not found' });
        }
        // Add this user to mother's children
        if (!mother.children) mother.children = [];
        if (!mother.children.includes(userId)) {
          await db.update('users', motherId, {
            children: [...mother.children, userId],
            updatedAt: new Date(),
          });
        }
      }
      updates.motherId = motherId || null;
    }

    // Update spouse (bidirectional)
    if (spouseId !== undefined) {
      // Remove old spouse relationship
      if (user.spouseId && user.spouseId !== spouseId) {
        await db.update('users', user.spouseId, {
          spouseId: null,
          updatedAt: new Date(),
        });
      }

      if (spouseId) {
        const spouse = await db.findById('users', spouseId);
        if (!spouse) {
          return res.status(404).json({ message: 'Spouse not found' });
        }
        // Set bidirectional spouse relationship
        await db.update('users', spouseId, {
          spouseId: userId,
          updatedAt: new Date(),
        });
      }
      updates.spouseId = spouseId || null;
    }

    // Update children
    if (children !== undefined) {
      updates.children = children || [];
    }

    // Calculate generation based on parents
    if (fatherId || motherId) {
      const parentId = fatherId || motherId;
      const parent = await db.findById('users', parentId);
      if (parent) {
        updates.generation = (parent.generation || 1) + 1;
      }
    }

    await db.update('users', userId, updates);

    const updatedUser = await db.findById('users', userId);
    const immediateFamily = await getImmediateFamily(updatedUser);

    res.json({
      message: 'Family relationships updated successfully',
      member: updatedUser,
      ...immediateFamily,
    });
  } catch (error: any) {
    console.error('Update family relationships error:', error);
    res.status(500).json({ message: 'Failed to update relationships', error: error.message });
  }
};

// Get family members by generation
export const getGenerationMembers = async (req: Request, res: Response) => {
  try {
    const { familyId, generation } = req.params;

    const members = await db.find('users', {
      familyId,
      generation: parseInt(generation),
    });

    res.json({
      generation: parseInt(generation),
      totalMembers: members.length,
      members,
    });
  } catch (error: any) {
    console.error('Get generation members error:', error);
    res.status(500).json({ message: 'Failed to fetch generation members', error: error.message });
  }
};

// Search users for family relationship selection
export const searchForRelatives = async (req: Request, res: Response) => {
  try {
    const { q, familyId, excludeId, relationshipType } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const query: any = {};
    if (familyId) {
      query.familyId = familyId;
    }

    const allUsers = await db.find('users', query);
    const searchTerm = String(q).toLowerCase();

    let results = allUsers.filter((u: any) => {
      if (excludeId && u._id === excludeId) return false;
      
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
      const email = u.email?.toLowerCase() || '';
      const phone = u.phone || '';
      
      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             phone.includes(searchTerm);
    });

    // Filter by gender for specific relationships
    if (relationshipType === 'father') {
      results = results.filter((u: any) => u.gender === 'male');
    } else if (relationshipType === 'mother') {
      results = results.filter((u: any) => u.gender === 'female');
    }

    // Limit results
    results = results.slice(0, 20);

    // Remove sensitive data
    results = results.map((u: any) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });

    res.json({
      query: q,
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Search relatives error:', error);
    res.status(500).json({ message: 'Failed to search relatives', error: error.message });
  }
};

// Helper function to build tree structure
function buildTreeStructure(users: any[]) {
  // If no users, return empty array
  if (!users || users.length === 0) {
    return [];
  }

  // Create a map of userId -> user for quick lookups
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user._id, {
      ...user,
      children: [],
      spouses: [],
    });
  });

  const rootNodes: any[] = [];
  const processedIds = new Set<string>();

  // First pass: identify parent-child relationships and build tree structure
  users.forEach(user => {
    const node = userMap.get(user._id);
    
    // Check if this user has a parent in the tree
    const hasParent = (user.fatherId && userMap.has(user.fatherId)) || 
                      (user.motherId && userMap.has(user.motherId));
    
    if (hasParent) {
      // Add to parent's children
      if (user.fatherId && userMap.has(user.fatherId)) {
        const father = userMap.get(user.fatherId);
        if (!father.children.find((c: any) => c._id === user._id)) {
          father.children.push(node);
        }
      }
      if (user.motherId && userMap.has(user.motherId)) {
        const mother = userMap.get(user.motherId);
        if (!mother.children.find((c: any) => c._id === user._id)) {
          mother.children.push(node);
        }
      }
      processedIds.add(user._id);
    } else {
      // No parent found in tree, this is a root node
      if (!processedIds.has(user._id) && !rootNodes.find(n => n._id === user._id)) {
        rootNodes.push(node);
        processedIds.add(user._id);
      }
    }
  });

  // Second pass: link spouses
  users.forEach(user => {
    const node = userMap.get(user._id);
    if (user.spouseId && userMap.has(user.spouseId)) {
      const spouse = userMap.get(user.spouseId);
      if (!node.spouses.find((s: any) => s._id === spouse._id)) {
        node.spouses.push(spouse);
      }
    }
  });

  // If no tree structure was built (no parent-child relationships), return all users as root nodes
  if (rootNodes.length === 0) {
    return users.map(user => {
      const node = userMap.get(user._id);
      return node || { ...user, children: [], spouses: [] };
    });
  }

  return rootNodes;
}

// Helper function to get immediate family
async function getImmediateFamily(user: any) {
  const father = user.fatherId ? await db.findById('users', user.fatherId) : null;
  const mother = user.motherId ? await db.findById('users', user.motherId) : null;
  const spouse = user.spouseId ? await db.findById('users', user.spouseId) : null;
  
  const children = [];
  if (user.children && user.children.length > 0) {
    for (const childId of user.children) {
      const child = await db.findById('users', childId);
      if (child) children.push(child);
    }
  }

  // Get siblings (same parents)
  const siblings = [];
  if (father || mother) {
    const parentId = father?._id || mother?._id;
    let parent = null;
    if (parentId) {
      parent = await db.findById('users', parentId);
    }
    if (parent && parent.children) {
      for (const siblingId of parent.children) {
        if (siblingId !== user._id) {
          const sibling = await db.findById('users', siblingId);
          if (sibling) siblings.push(sibling);
        }
      }
    }
  }

  return {
    father: father ? { ...father, password: undefined } : null,
    mother: mother ? { ...mother, password: undefined } : null,
    spouse: spouse ? { ...spouse, password: undefined } : null,
    children: children.map(c => ({ ...c, password: undefined })),
    siblings: siblings.map(s => ({ ...s, password: undefined })),
  };
}

// Get breadcrumb path from root to a specific member
export const getMemberPath = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const path = [];
    let currentUser = await db.findById('users', userId);
    
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Traverse up to root
    while (currentUser) {
      path.unshift({
        _id: currentUser._id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        generation: currentUser.generation,
      });

      // Move to parent (father takes precedence)
      if (currentUser.fatherId) {
        currentUser = await db.findById('users', currentUser.fatherId);
      } else if (currentUser.motherId) {
        currentUser = await db.findById('users', currentUser.motherId);
      } else {
        break;
      }
    }

    res.json({
      userId,
      path,
      totalGenerations: path.length,
    });
  } catch (error: any) {
    console.error('Get member path error:', error);
    res.status(500).json({ message: 'Failed to get member path', error: error.message });
  }
};
