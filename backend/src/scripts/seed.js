import 'dotenv/config';
import bcrypt from 'bcrypt';
import connectDB from '../config/database.js';
import User from '../models/User.js';
import Workflow from '../models/Workflow.js';
import WorkflowVersion from '../models/WorkflowVersion.js';
import logger from '../utils/logger.js';

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Workflow.deleteMany({});
    await WorkflowVersion.deleteMany({});

    // Create users
    logger.info('Creating users...');
    const password = await bcrypt.hash('password123', 10);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@smartops.com',
      passwordHash: password,
      role: 'admin'
    });

    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@smartops.com',
      passwordHash: password,
      role: 'manager'
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@smartops.com',
      passwordHash: password,
      role: 'user'
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@smartops.com',
      passwordHash: password,
      role: 'user'
    });

    logger.info('Users created successfully');
    logger.info('Login credentials:');
    logger.info('  Admin: admin@smartops.com / password123');
    logger.info('  Manager: manager@smartops.com / password123');
    logger.info('  User1: john@smartops.com / password123');
    logger.info('  User2: jane@smartops.com / password123');

    // Create sample workflow
    logger.info('Creating sample workflows...');

    const workflow1 = await Workflow.create({
      name: 'Purchase Order Approval',
      description: 'Multi-level approval workflow for purchase orders',
      createdBy: admin._id,
      status: 'active',
      tags: ['finance', 'procurement']
    });

    const version1 = await WorkflowVersion.create({
      workflowId: workflow1._id,
      versionNumber: 1,
      isActive: true,
      steps: [
        {
          id: 'start',
          type: 'notification',
          label: 'Start Workflow',
          config: {
            message: 'Purchase order workflow initiated'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'manager-approval',
          type: 'approval',
          label: 'Manager Approval',
          assigneeRole: 'manager',
          slaHours: 24,
          config: {
            description: 'Manager needs to approve this purchase order'
          },
          position: { x: 300, y: 100 }
        },
        {
          id: 'admin-approval',
          type: 'approval',
          label: 'Admin Final Approval',
          assigneeRole: 'admin',
          slaHours: 48,
          config: {
            description: 'Admin final approval required'
          },
          position: { x: 500, y: 100 }
        },
        {
          id: 'notify-completion',
          type: 'notification',
          label: 'Notify Completion',
          config: {
            message: 'Purchase order has been approved'
          },
          position: { x: 700, y: 100 }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'manager-approval',
          label: ''
        },
        {
          id: 'e2',
          source: 'manager-approval',
          target: 'admin-approval',
          label: 'Approved'
        },
        {
          id: 'e3',
          source: 'admin-approval',
          target: 'notify-completion',
          label: 'Approved'
        }
      ]
    });

    workflow1.currentVersion = version1._id;
    workflow1.versions.push(version1._id);
    await workflow1.save();

    // Create another sample workflow
    const workflow2 = await Workflow.create({
      name: 'Employee Onboarding',
      description: 'Standard employee onboarding workflow',
      createdBy: manager._id,
      status: 'active',
      tags: ['hr', 'onboarding']
    });

    const version2 = await WorkflowVersion.create({
      workflowId: workflow2._id,
      versionNumber: 1,
      isActive: true,
      steps: [
        {
          id: 'start',
          type: 'notification',
          label: 'Start Onboarding',
          config: {
            message: 'New employee onboarding initiated'
          },
          position: { x: 100, y: 100 }
        },
        {
          id: 'hr-review',
          type: 'approval',
          label: 'HR Document Review',
          assignee: user1._id,
          slaHours: 48,
          config: {
            description: 'Review and verify all employee documents'
          },
          position: { x: 300, y: 100 }
        },
        {
          id: 'it-setup',
          type: 'approval',
          label: 'IT Account Setup',
          assignee: user2._id,
          slaHours: 24,
          config: {
            description: 'Setup email, systems access, and equipment'
          },
          position: { x: 500, y: 100 }
        },
        {
          id: 'complete',
          type: 'notification',
          label: 'Onboarding Complete',
          config: {
            message: 'Employee onboarding completed successfully'
          },
          position: { x: 700, y: 100 }
        }
      ],
      edges: [
        {
          id: 'e1',
          source: 'start',
          target: 'hr-review',
          label: ''
        },
        {
          id: 'e2',
          source: 'hr-review',
          target: 'it-setup',
          label: 'Approved'
        },
        {
          id: 'e3',
          source: 'it-setup',
          target: 'complete',
          label: 'Completed'
        }
      ]
    });

    workflow2.currentVersion = version2._id;
    workflow2.versions.push(version2._id);
    await workflow2.save();

    logger.info('Sample workflows created successfully');
    logger.info(`Workflow 1: ${workflow1.name} (ID: ${workflow1._id})`);
    logger.info(`Workflow 2: ${workflow2.name} (ID: ${workflow2._id})`);

    logger.info('✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    logger.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedData();

