import { z } from "zod";

/**
 * @file Complete Zod schemas for all Smartschool API methods
 *
 * These schemas mirror the TypeScript interfaces from @abrianto/smartschool-kit
 * but are defined as Zod schemas for runtime validation and MCP parameter generation.
 *
 * This approach ensures:
 * - Type safety at runtime
 * - Proper parameter validation
 * - Rich descriptions for AI understanding
 * - Complete API coverage
 */

// =============================================================================
// BASE SCHEMAS
// =============================================================================

const UserIdentifierSchema = z.string().describe(`User identifier. Can be:
• Username (e.g., 'john.doe' for John Doe)  
• Internal number (e.g., '12345')
• Student ID
Note: Usernames typically follow 'firstname.lastname' pattern in lowercase.`);

const ClassCodeSchema = z.string().describe(`Class or group code. Examples:
• Grade-based: '1A', '2B', '3C'
• Descriptive: 'STEM-GROUP-1', 'CHESS-CLUB'
• Year-specific: '6WEWE-2024'`);

const DateSchema = z
  .string()
  .describe("Date in YYYY-MM-DD format (e.g., '2024-12-15')");

const SchoolYearSchema = z
  .string()
  .describe(
    "School year as starting year (e.g., '2024' for school year 2024-2025)",
  );

const OfficialDateSchema = z
  .string()
  .optional()
  .describe(
    "Official date for the action (YYYY-MM-DD format). If not provided, may require manual confirmation in Smartschool.",
  );

const UserRoleSchema = z.enum(["leerling", "leerkracht", "directie", "andere"])
  .describe(`User role in school:
• 'leerling': Student - A student enrolled in the school
• 'leerkracht': Teacher - A teaching staff member  
• 'directie': Management - School management/administrative staff
• 'andere': Other - Other staff (secretary, janitor, etc.)`);

const CoAccountTypeSchema = z.number().min(0).max(6).describe(`Co-account type:
• 0: Main account
• 1: First co-account (often parent/guardian)
• 2: Second co-account (often second parent/guardian)
• 3-6: Additional co-accounts`);

const ConfirmationSchema = z
  .literal(true)
  .describe("🔥 REQUIRED: Set to true to confirm this destructive operation");

const CriticalConfirmationSchema = z
  .literal(true)
  .describe(
    "💀 REQUIRED: Set to true to confirm this CRITICAL operation that may permanently delete data",
  );

// =============================================================================
// USER MANAGEMENT SCHEMAS
// =============================================================================

export const GetUserDetailsSchema = z.object({
  userIdentifier: UserIdentifierSchema,
});

export const GetUserDetailsByNumberSchema = z.object({
  number: z
    .string()
    .describe("The internal number of the user to get details for"),
});

export const GetUserDetailsByUsernameSchema = z.object({
  username: z.string().describe("The username of the user to get details for"),
});

export const GetUserDetailsByScannableCodeSchema = z.object({
  scannableCode: z
    .string()
    .describe(
      "The scannable code of the user to get details for (UUID format)",
    ),
});

export const SaveUserSchema = z.object({
  username: z
    .string()
    .describe(
      "Username for login (typically 'firstname.lastname', e.g., 'john.doe')",
    ),
  name: z.string().describe("First name of the user"),
  surname: z.string().describe("Last name of the user"),
  basisrol: UserRoleSchema,
  passwd1: z
    .string()
    .optional()
    .describe("Primary password (required for new users)"),
  internnumber: z.string().optional().describe("Internal number identifier"),
  extranames: z.string().optional().describe("Additional names of the user"),
  initials: z.string().optional().describe("User's initials"),
  sex: z.string().optional().describe("User's gender/sex"),
  birthdate: z
    .string()
    .optional()
    .describe("Date of birth, format: YYYY-MM-DD or DD-MM-YYYY"),
  birthcity: z.string().optional().describe("City of birth"),
  birthcountry: z.string().optional().describe("Country of birth"),
  nationality: z.string().optional().describe("User's nationality"),
  address: z
    .string()
    .optional()
    .describe(
      "Full street address including house number and box/apartment number",
    ),
  postalcode: z.string().optional().describe("Postal code"),
  city: z.string().optional().describe("City of residence"),
  country: z.string().optional().describe("Country of residence"),
  phone: z.string().optional().describe("Phone number"),
  mobile: z.string().optional().describe("Mobile phone number"),
  email: z.string().email().optional().describe("Email address"),
  passwd2: z.string().optional().describe("Secondary password"),
  passwd3: z.string().optional().describe("Tertiary password"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const DelUserSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  officialDate: OfficialDateSchema,
  confirmDestructiveAction: CriticalConfirmationSchema,
});

export const SetAccountStatusSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountStatus: z
    .string()
    .describe(
      "Account status: 'actief', 'niet actief', or 'actief tot en met yyyy/mm/dd'",
    ),
});

export const ChangeUsernameSchema = z.object({
  internNumber: z.string().describe("Current internal number of the user"),
  newUsername: z.string().describe("New username to assign"),
});

export const ChangeInternNumberSchema = z.object({
  username: z.string().describe("Username of the target user"),
  newInternNumber: z.string().describe("New internal number to assign"),
});

export const ReplaceInumSchema = z.object({
  oldInum: z.string().describe("The current internal number"),
  newInum: z.string().describe("The new internal number to replace with"),
});

export const SavePasswordSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  password: z.string().describe("The new password to set for the user"),
  accountType: CoAccountTypeSchema,
  changePasswordAtNextLogin: z
    .number()
    .describe(
      "Whether the user must change password at next login (1) or not (0)",
    ),
});

export const ChangePasswordAtNextLoginSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountType: CoAccountTypeSchema,
});

export const ForcePasswordResetSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountType: CoAccountTypeSchema,
});

export const SaveUserParameterSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  paramName: z
    .string()
    .describe(
      "The parameter name to save (e.g., 'email', 'status_coaccount1', 'Godsdienstkeuze')",
    ),
  paramValue: z
    .string()
    .describe(
      "The value for the parameter. For checkbox fields, use semicolon-separated values. For GO! roles, use JSON encoded array.",
    ),
});

export const RemoveCoAccountSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountType: CoAccountTypeSchema,
  confirmDestructiveAction: ConfirmationSchema,
});

export const GetUserOfficialClassSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  date: DateSchema,
});

export const GetStudentCareerSchema = z.object({
  userIdentifier: UserIdentifierSchema,
});

export const UnregisterStudentSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  officialDate: OfficialDateSchema,
  confirmDestructiveAction: CriticalConfirmationSchema,
});

// =============================================================================
// CLASS & GROUP MANAGEMENT SCHEMAS
// =============================================================================

export const SaveClassSchema = z.object({
  name: z.string().describe("The name of the class or group"),
  desc: z.string().describe("The description of the class or group"),
  code: ClassCodeSchema,
  parent: z.string().describe("The parent class/group code"),
  untis: z.string().describe("The roster code (see UserDetails)"),
  instituteNumber: z
    .string()
    .optional()
    .describe(
      "Optional institute number, solely for adding an official class/group",
    ),
  adminNumber: z
    .string()
    .optional()
    .describe(
      "Optional administrative number, solely for adding an official class/group",
    ),
  schoolYearDate: z
    .string()
    .optional()
    .describe(
      "Optional school year date, format: YYYY-MM-DD, defaults to current school year",
    ),
  confirmDestructiveAction: ConfirmationSchema,
});

export const SaveGroupSchema = z.object({
  name: z.string().describe("The name of the group"),
  desc: z.string().describe("The description of the group"),
  code: ClassCodeSchema,
  parent: z.string().describe("The parent group code"),
  untis: z.string().describe("The Untis identifier"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const DelClassSchema = z.object({
  code: ClassCodeSchema,
  confirmDestructiveAction: CriticalConfirmationSchema,
});

export const GetAllAccountsSchema = z.object({
  code: ClassCodeSchema,
  recursive: z
    .string()
    .describe("Whether to get subgroups recursively ('1') or not ('0')"),
});

export const GetAllAccountsExtendedSchema = z.object({
  code: ClassCodeSchema,
  recursive: z
    .string()
    .describe("Whether to get subgroups recursively ('1') or not ('0')"),
});

export const SaveUserToClassSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  class: ClassCodeSchema.describe("The class code to add the user to"),
  officialDate: OfficialDateSchema,
});

export const SaveUserToClassesSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  csvList: z.string().describe("CSV list of class codes to add the user to"),
});

export const SaveUserToClassesAndGroupsSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  csvList: z
    .string()
    .describe("CSV list of class and group codes to add the user to"),
  keepOld: z
    .number()
    .describe(
      "Whether to keep old class/group memberships (1) or remove them (0)",
    ),
});

export const RemoveUserFromGroupSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  class: ClassCodeSchema.describe(
    "The class/group code to remove the user from",
  ),
  officialDate: OfficialDateSchema,
});

export const ClearGroupSchema = z.object({
  group: z.string().describe("Group code to clear"),
  officialDate: OfficialDateSchema,
  confirmDestructiveAction: CriticalConfirmationSchema,
});

export const ChangeGroupOwnersSchema = z.object({
  code: ClassCodeSchema.describe("Target class or group code to modify owners"),
  userlist: z.string().describe("Comma-separated list of user identifiers"),
});

export const GetClassTeachersSchema = z.object({
  getAllOwners: z
    .boolean()
    .optional()
    .describe(
      "Gets all class titulars (if true) or only the first titular (if false, default)",
    ),
});

export const GetSchoolyearDataOfClassSchema = z.object({
  classCode: ClassCodeSchema.describe(
    "The class code to get school year data for",
  ),
});

export const SaveSchoolyearDataOfClassSchema = z.object({
  classCode: ClassCodeSchema.describe(
    "The class code to save school year data for",
  ),
  date: DateSchema.describe("The date for the school year data"),
  instituteNumber: z.string().describe("The institute number"),
  administrativeGroupNumber: z
    .string()
    .describe("The administrative group number"),
  residence: z.string().describe("The residence location"),
  domain: z.string().describe("The domain of study"),
  principal: z.string().describe("The principal's name or identifier"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const SaveClassListSchema = z.object({
  serializedList: z
    .string()
    .describe("Serialized list of classes in CSV format"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const SaveClassListJsonSchema = z.object({
  jsonList: z
    .string()
    .describe("Serialized array containing the list of classes"),
  confirmDestructiveAction: ConfirmationSchema,
});

// =============================================================================
// COMMUNICATION SCHEMAS
// =============================================================================

export const SendMsgSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  title: z.string().describe("The title/subject of the message"),
  body: z.string().describe("The body/content of the message"),
  senderIdentifier: z
    .string()
    .describe(
      "Unique identifier of the message sender. Use 'Null' string to send without specifying a sender",
    ),
  attachments: z
    .array(z.string())
    .optional()
    .describe(
      "Optional array of file attachments. Each attachment must be base64 encoded",
    ),
  coaccount: CoAccountTypeSchema.optional(),
  copyToLVS: z
    .boolean()
    .optional()
    .describe(
      "Whether to add the message to the LVS (Student Tracking System)",
    ),
});

export const SaveSignatureSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountType: CoAccountTypeSchema,
  signature: z.string().describe("The signature text or data to save"),
});

// =============================================================================
// ATTENDANCE & ABSENCE SCHEMAS
// =============================================================================

export const GetAbsentsSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  schoolYear: SchoolYearSchema,
});

export const GetAbsentsByDateSchema = z.object({
  date: DateSchema.describe("The date to get absents for"),
});

export const GetAbsentsByDateAndGroupSchema = z.object({
  date: DateSchema.describe("The date to get absents for"),
  code: ClassCodeSchema,
});

export const GetAbsentsWithAliasSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  schoolYear: SchoolYearSchema,
});

export const GetAbsentsWithAliasByDateSchema = z.object({
  date: DateSchema.describe("The date to get absents for"),
});

export const GetAbsentsWithInternalNumberByDateSchema = z.object({
  date: DateSchema.describe("The date to get absents for"),
});

export const GetAbsentsWithUsernameByDateSchema = z.object({
  date: DateSchema.describe("The date to get absents for"),
});

// =============================================================================
// COURSE MANAGEMENT SCHEMAS
// =============================================================================

export const AddCourseSchema = z.object({
  coursename: z.string().describe("Full name of the course"),
  coursedesc: z.string().describe("Unique course code identifier"),
  visibility: z
    .number()
    .optional()
    .describe("Course visibility status: 1 = Visible, 0 = Hidden"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const AddCourseStudentsSchema = z.object({
  coursename: z.string().describe("Full name of the course"),
  coursedesc: z.string().describe("Unique course code identifier"),
  groupIds: z.string().describe("Comma-separated list of class or group codes"),
  confirmDestructiveAction: ConfirmationSchema,
});

export const AddCourseTeacherSchema = z.object({
  coursename: z.string().describe("Full name of the course"),
  coursedesc: z.string().describe("Unique course code identifier"),
  userIdentifier: UserIdentifierSchema,
  internnummer: z
    .string()
    .describe("Internal number identifier of the teacher"),
  confirmDestructiveAction: ConfirmationSchema,
});

// =============================================================================
// HELPDESK SCHEMAS
// =============================================================================

export const AddHelpdeskTicketSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  title: z.string().describe("Title/subject of the helpdesk ticket"),
  description: z.string().describe("Detailed description of the issue"),
  priority: z
    .number()
    .describe(
      "Priority level of the ticket (e.g., 1: Low, 2: Normal, 3: High)",
    ),
  miniDbItem: z
    .string()
    .describe("Category ID from the helpdesk mini-database"),
});

export const GetHelpdeskMiniDbItemsSchema = z.object({});

// =============================================================================
// PHOTO MANAGEMENT SCHEMAS
// =============================================================================

export const GetAccountPhotoSchema = z.object({
  userIdentifier: UserIdentifierSchema,
});

export const SetAccountPhotoSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  photo: z
    .string()
    .describe(
      "Base64 encoded photo data. Use empty string to remove existing photo",
    ),
});

// =============================================================================
// SYSTEM & SYNC SCHEMAS
// =============================================================================

export const StartSkoreSyncSchema = z.object({
  confirmDestructiveAction: CriticalConfirmationSchema,
});

export const CheckStatusSchema = z.object({
  serviceId: z.string().describe("Task ID received from startSkoreSync"),
});

export const GetSkoreClassTeacherCourseRelationSchema = z.object({});

export const ReturnJsonErrorCodesSchema = z.object({});

export const ReturnCsvErrorCodesSchema = z.object({});

export const GetReferenceFieldSchema = z.object({});

export const GetCoursesSchema = z.object({});

export const GetAllGroupsAndClassesSchema = z.object({});

export const GetClassListSchema = z.object({});

export const GetClassListJsonSchema = z.object({});

export const DeactivateTwoFactorAuthenticationSchema = z.object({
  userIdentifier: UserIdentifierSchema,
  accountType: CoAccountTypeSchema,
  confirmDestructiveAction: CriticalConfirmationSchema,
});

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

/**
 * Complete registry of all method schemas
 * Maps method names to their corresponding Zod schemas
 */
export const SCHEMA_REGISTRY: Record<string, z.ZodObject<any>> = {
  // User Management
  getUserDetails: GetUserDetailsSchema,
  getUserDetailsByNumber: GetUserDetailsByNumberSchema,
  getUserDetailsByUsername: GetUserDetailsByUsernameSchema,
  getUserDetailsByScannableCode: GetUserDetailsByScannableCodeSchema,
  saveUser: SaveUserSchema,
  delUser: DelUserSchema,
  setAccountStatus: SetAccountStatusSchema,
  changeUsername: ChangeUsernameSchema,
  changeInternNumber: ChangeInternNumberSchema,
  replaceInum: ReplaceInumSchema,
  savePassword: SavePasswordSchema,
  changePasswordAtNextLogin: ChangePasswordAtNextLoginSchema,
  forcePasswordReset: ForcePasswordResetSchema,
  saveUserParameter: SaveUserParameterSchema,
  removeCoAccount: RemoveCoAccountSchema,
  getUserOfficialClass: GetUserOfficialClassSchema,
  getStudentCareer: GetStudentCareerSchema,
  unregisterStudent: UnregisterStudentSchema,

  // Class & Group Management
  saveClass: SaveClassSchema,
  saveGroup: SaveGroupSchema,
  delClass: DelClassSchema,
  getAllAccounts: GetAllAccountsSchema,
  getAllAccountsExtended: GetAllAccountsExtendedSchema,
  saveUserToClass: SaveUserToClassSchema,
  saveUserToClasses: SaveUserToClassesSchema,
  saveUserToClassesAndGroups: SaveUserToClassesAndGroupsSchema,
  removeUserFromGroup: RemoveUserFromGroupSchema,
  clearGroup: ClearGroupSchema,
  changeGroupOwners: ChangeGroupOwnersSchema,
  getClassTeachers: GetClassTeachersSchema,
  getSchoolyearDataOfClass: GetSchoolyearDataOfClassSchema,
  saveSchoolyearDataOfClass: SaveSchoolyearDataOfClassSchema,
  saveClassList: SaveClassListSchema,
  saveClassListJson: SaveClassListJsonSchema,

  // Communication
  sendMsg: SendMsgSchema,
  saveSignature: SaveSignatureSchema,

  // Attendance & Absences
  getAbsents: GetAbsentsSchema,
  getAbsentsByDate: GetAbsentsByDateSchema,
  getAbsentsByDateAndGroup: GetAbsentsByDateAndGroupSchema,
  getAbsentsWithAlias: GetAbsentsWithAliasSchema,
  getAbsentsWithAliasByDate: GetAbsentsWithAliasByDateSchema,
  getAbsentsWithInternalNumberByDate: GetAbsentsWithInternalNumberByDateSchema,
  getAbsentsWithUsernameByDate: GetAbsentsWithUsernameByDateSchema,

  // Course Management
  addCourse: AddCourseSchema,
  addCourseStudents: AddCourseStudentsSchema,
  addCourseTeacher: AddCourseTeacherSchema,

  // Helpdesk
  addHelpdeskTicket: AddHelpdeskTicketSchema,
  getHelpdeskMiniDbItems: GetHelpdeskMiniDbItemsSchema,

  // Photo Management
  getAccountPhoto: GetAccountPhotoSchema,
  setAccountPhoto: SetAccountPhotoSchema,

  // System & Sync
  startSkoreSync: StartSkoreSyncSchema,
  checkStatus: CheckStatusSchema,
  getSkoreClassTeacherCourseRelation: GetSkoreClassTeacherCourseRelationSchema,
  returnJsonErrorCodes: ReturnJsonErrorCodesSchema,
  returnCsvErrorCodes: ReturnCsvErrorCodesSchema,
  getReferenceField: GetReferenceFieldSchema,
  getCourses: GetCoursesSchema,
  getAllGroupsAndClasses: GetAllGroupsAndClassesSchema,
  getClassList: GetClassListSchema,
  getClassListJson: GetClassListJsonSchema,
  deactivateTwoFactorAuthentication: DeactivateTwoFactorAuthenticationSchema,
};

/**
 * Get schema for a method name, with fallback for unknown methods
 */
export function getMethodSchema(methodName: string): z.ZodObject<any> {
  return (
    SCHEMA_REGISTRY[methodName] ||
    z.object({
      // Fallback schema for unknown methods
      ...Object.fromEntries(
        Object.entries(arguments).map(([key]) => [
          key,
          z.any().describe(`Parameter for ${methodName}`),
        ]),
      ),
    })
  );
}
