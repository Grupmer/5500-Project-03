-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('invited', 'confirmed', 'attended', 'declined');

-- CreateEnum
CREATE TYPE "ContactPhoneType" AS ENUM ('Home', 'Work', 'Mobile');

-- CreateEnum
CREATE TYPE "SubscriptionPreference" AS ENUM ('Opt_out', 'Opt_in');

-- CreateEnum
CREATE TYPE "CommunicationPreference" AS ENUM ('Thank_you', 'Magazine', 'Inspiration_event', 'Newsletter', 'Survey', 'Holiday_Card', 'Event', 'Appeal', 'Research_update');

-- CreateEnum
CREATE TYPE "City" AS ENUM ('Victoria', 'Nanaimo', 'Courtenay', 'Parksville', 'Campbell_River', 'Saanich', 'Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'North_Vancouver', 'White_Rock', 'Coquitlam', 'West_Vancouver', 'New_Westminster', 'Prince_George', 'Williams_Lake', 'Delta', 'Abbotsford', 'Maple_Ridge', 'Kelowna', 'Langley', 'Port_Coquitlam', 'Vernon', 'Kamloops', 'Salmon_Arm');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" VARCHAR(20),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor" (
    "id" TEXT NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "nick_name" VARCHAR(255),
    "last_name" VARCHAR(255) NOT NULL,
    "organization_name" VARCHAR(255),
    "unit_number" VARCHAR(255),
    "street_address" TEXT NOT NULL,
    "city" "City" NOT NULL,
    "total_donation_amount" DECIMAL(10,2) DEFAULT 0,
    "total_pledge" DECIMAL(10,2),
    "largest_gift_amount" DECIMAL(10,2),
    "largest_gift_appeal" VARCHAR(255),
    "last_gift_amount" DECIMAL(10,2),
    "last_gift_request" VARCHAR(255),
    "last_gift_appeal" VARCHAR(255),
    "first_gift_date" TIMESTAMP(3),
    "last_gift_date" TIMESTAMP(3),
    "pmm" TEXT NOT NULL,
    "exclude" BOOLEAN,
    "deceased" BOOLEAN,
    "contact_phone_type" "ContactPhoneType",
    "phone_restrictions" TEXT,
    "email_restrictions" TEXT,
    "communication_restrictions" TEXT,
    "subscription_events_in_person" "SubscriptionPreference",
    "subscription_events_magazine" "SubscriptionPreference",
    "communication_preference" "CommunicationPreference",
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "attendance_lable" BOOLEAN,
    "donation_lable" BOOLEAN,
    "total_invitations" INTEGER DEFAULT 0,
    "total_attendance" INTEGER DEFAULT 0,
    "last_invitation_attendance" BOOLEAN,
    "invitation_acceptance_rate" DOUBLE PRECISION,
    "ml_score" DOUBLE PRECISION,

    CONSTRAINT "Donor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor_Tag" (
    "donor_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donor_Tag_pkey" PRIMARY KEY ("donor_id","tag_id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "location" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'draft',
    "capacity" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" INTEGER,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCollaborator" (
    "id" SERIAL NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "EventCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donor_Event" (
    "donor_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "ParticipationStatus",
    "counted_invitation" BOOLEAN NOT NULL DEFAULT false,
    "counted_attendance" BOOLEAN NOT NULL DEFAULT false,
    "decline_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donor_Event_pkey" PRIMARY KEY ("donor_id","event_id")
);

-- CreateTable
CREATE TABLE "Event_Edit_History" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "editor_id" INTEGER,
    "edit_type" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_Edit_History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EventTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Tag_name_idx" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "Donor_last_name_idx" ON "Donor"("last_name");

-- CreateIndex
CREATE INDEX "Donor_organization_name_idx" ON "Donor"("organization_name");

-- CreateIndex
CREATE INDEX "Donor_city_idx" ON "Donor"("city");

-- CreateIndex
CREATE INDEX "Donor_exclude_idx" ON "Donor"("exclude");

-- CreateIndex
CREATE INDEX "Donor_deceased_idx" ON "Donor"("deceased");

-- CreateIndex
CREATE INDEX "Donor_pmm_idx" ON "Donor"("pmm");

-- CreateIndex
CREATE INDEX "Donor_communication_preference_idx" ON "Donor"("communication_preference");

-- CreateIndex
CREATE INDEX "Donor_subscription_events_in_person_idx" ON "Donor"("subscription_events_in_person");

-- CreateIndex
CREATE INDEX "Donor_subscription_events_magazine_idx" ON "Donor"("subscription_events_magazine");

-- CreateIndex
CREATE INDEX "Donor_created_at_idx" ON "Donor"("created_at");

-- CreateIndex
CREATE INDEX "Donor_Tag_donor_id_idx" ON "Donor_Tag"("donor_id");

-- CreateIndex
CREATE INDEX "Donor_Tag_tag_id_idx" ON "Donor_Tag"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "Event_name_key" ON "Event"("name");

-- CreateIndex
CREATE INDEX "Event_date_idx" ON "Event"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EventCollaborator_eventId_userId_key" ON "EventCollaborator"("eventId", "userId");

-- CreateIndex
CREATE INDEX "Donor_Event_donor_id_idx" ON "Donor_Event"("donor_id");

-- CreateIndex
CREATE INDEX "Donor_Event_event_id_idx" ON "Donor_Event"("event_id");

-- CreateIndex
CREATE INDEX "Event_Edit_History_event_id_idx" ON "Event_Edit_History"("event_id");

-- CreateIndex
CREATE INDEX "Event_Edit_History_editor_id_idx" ON "Event_Edit_History"("editor_id");

-- CreateIndex
CREATE INDEX "_EventTags_B_index" ON "_EventTags"("B");

-- AddForeignKey
ALTER TABLE "Donor_Tag" ADD CONSTRAINT "Donor_Tag_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donor_Tag" ADD CONSTRAINT "Donor_Tag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventCollaborator" ADD CONSTRAINT "EventCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donor_Event" ADD CONSTRAINT "Donor_Event_donor_id_fkey" FOREIGN KEY ("donor_id") REFERENCES "Donor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donor_Event" ADD CONSTRAINT "Donor_Event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Edit_History" ADD CONSTRAINT "Event_Edit_History_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event_Edit_History" ADD CONSTRAINT "Event_Edit_History_editor_id_fkey" FOREIGN KEY ("editor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
