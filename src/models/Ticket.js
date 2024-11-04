const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed', 'on-hold'],
        default: 'open',
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    closedAt: {
        type: Date,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
    }],
    attachments: [{
        filename: { type: String },
        fileUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
    }],
    category: {
        type: String,
        enum: ['technical', 'financial', 'general', 'other'],
        default: 'general',
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
});

TicketSchema.index({ status: 1, priority: 1 });

const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = Ticket;
