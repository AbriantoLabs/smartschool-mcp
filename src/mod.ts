#!/usr/bin/env node
/**
 * Smartschool domain knowledge and conventions
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { SmartschoolClient } from "@abrianto/smartschool-kit";

/**
 * @file Dynamic MCP Server for Smartschool API
 *
 * This server automatically discovers all SmartschoolClient methods and creates
 * corresponding MCP tools with rich context for AI understanding.
 *
 * Features:
 * - Auto-discovery of all client methods
 * - Rich contextual descriptions for AI
 * - Automatic adaptation to package updates
 * - Intelligent parameter inference from TypeScript types
 * - Safety guardrails for destructive operations
 */

// Configuration
const SMARTSCHOOL_API_ENDPOINT = process.env.SMARTSCHOOL_API_ENDPOINT;
const SMARTSCHOOL_ACCESS_CODE = process.env.SMARTSCHOOL_ACCESS_CODE;
const ALLOW_DESTRUCTIVE = process.env.ALLOW_DESTRUCTIVE === "true";
const REQUIRE_CONFIRMATION = process.env.REQUIRE_CONFIRMATION !== "false"; // Default true

if (!SMARTSCHOOL_API_ENDPOINT || !SMARTSCHOOL_ACCESS_CODE) {
  console.error(
    "Missing SMARTSCHOOL_API_ENDPOINT or SMARTSCHOOL_ACCESS_CODE environment variables.",
  );
  process.exit(1);
}

// Initialize client
let smartschoolClient: SmartschoolClient;
try {
  smartschoolClient = new SmartschoolClient({
    apiEndpoint: SMARTSCHOOL_API_ENDPOINT,
    accesscode: SMARTSCHOOL_ACCESS_CODE,
  });
} catch (error) {
  console.error("Failed to initialize SmartschoolClient:", error);
  process.exit(1);
}

// Create server
const server = new McpServer({
  name: "smartschool-dynamic",
  version: "1.0.0",
});

/**
 * Safety classification for API methods
 */
const SAFETY_LEVELS = {
  SAFE: "safe", // Read-only operations, no risk
  MODERATE: "moderate", // Modifications that are reversible
  DESTRUCTIVE: "destructive", // Irreversible or high-impact operations
  CRITICAL: "critical", // System-level changes that could break things
} as const;

type SafetyLevel = (typeof SAFETY_LEVELS)[keyof typeof SAFETY_LEVELS];

/**
 * Method safety classification
 */
const METHOD_SAFETY: Record<string, SafetyLevel> = {
  // SAFE - Read-only operations
  getUserDetails: SAFETY_LEVELS.SAFE,
  getUserDetailsByUsername: SAFETY_LEVELS.SAFE,
  getUserDetailsByNumber: SAFETY_LEVELS.SAFE,
  getUserDetailsByScannableCode: SAFETY_LEVELS.SAFE,
  getAbsents: SAFETY_LEVELS.SAFE,
  getAbsentsByDate: SAFETY_LEVELS.SAFE,
  getAbsentsByDateAndGroup: SAFETY_LEVELS.SAFE,
  getAbsentsWithAlias: SAFETY_LEVELS.SAFE,
  getAbsentsWithAliasByDate: SAFETY_LEVELS.SAFE,
  getAbsentsWithInternalNumberByDate: SAFETY_LEVELS.SAFE,
  getAbsentsWithUsernameByDate: SAFETY_LEVELS.SAFE,
  getClassTeachers: SAFETY_LEVELS.SAFE,
  getSchoolyearDataOfClass: SAFETY_LEVELS.SAFE,
  getStudentCareer: SAFETY_LEVELS.SAFE,
  getUserOfficialClass: SAFETY_LEVELS.SAFE,
  getAccountPhoto: SAFETY_LEVELS.SAFE,
  getAllAccounts: SAFETY_LEVELS.SAFE,
  getAllAccountsExtended: SAFETY_LEVELS.SAFE,
  getAllGroupsAndClasses: SAFETY_LEVELS.SAFE,
  getClassList: SAFETY_LEVELS.SAFE,
  getClassListJson: SAFETY_LEVELS.SAFE,
  getHelpdeskMiniDbItems: SAFETY_LEVELS.SAFE,
  getCourses: SAFETY_LEVELS.SAFE,
  returnJsonErrorCodes: SAFETY_LEVELS.SAFE,
  returnCsvErrorCodes: SAFETY_LEVELS.SAFE,
  checkStatus: SAFETY_LEVELS.SAFE,
  getReferenceField: SAFETY_LEVELS.SAFE,
  getSkoreClassTeacherCourseRelation: SAFETY_LEVELS.SAFE,

  // MODERATE - Reversible modifications
  sendMsg: SAFETY_LEVELS.MODERATE,
  saveSignature: SAFETY_LEVELS.MODERATE,
  setAccountPhoto: SAFETY_LEVELS.MODERATE,
  saveUserParameter: SAFETY_LEVELS.MODERATE,
  changeUsername: SAFETY_LEVELS.MODERATE,
  changeInternNumber: SAFETY_LEVELS.MODERATE,
  replaceInum: SAFETY_LEVELS.MODERATE,
  savePassword: SAFETY_LEVELS.MODERATE,
  changePasswordAtNextLogin: SAFETY_LEVELS.MODERATE,
  forcePasswordReset: SAFETY_LEVELS.MODERATE,
  saveUserToClass: SAFETY_LEVELS.MODERATE,
  saveUserToClasses: SAFETY_LEVELS.MODERATE,
  saveUserToClassesAndGroups: SAFETY_LEVELS.MODERATE,
  removeUserFromGroup: SAFETY_LEVELS.MODERATE,
  addHelpdeskTicket: SAFETY_LEVELS.MODERATE,
  setAccountStatus: SAFETY_LEVELS.MODERATE,

  // DESTRUCTIVE - High impact, potentially irreversible
  saveUser: SAFETY_LEVELS.DESTRUCTIVE, // Creates/modifies users
  saveClass: SAFETY_LEVELS.DESTRUCTIVE, // Creates/modifies classes
  saveGroup: SAFETY_LEVELS.DESTRUCTIVE, // Creates/modifies groups
  addCourse: SAFETY_LEVELS.DESTRUCTIVE, // Creates courses
  addCourseStudents: SAFETY_LEVELS.DESTRUCTIVE,
  addCourseTeacher: SAFETY_LEVELS.DESTRUCTIVE,
  changeGroupOwners: SAFETY_LEVELS.DESTRUCTIVE,
  saveClassList: SAFETY_LEVELS.DESTRUCTIVE,
  saveClassListJson: SAFETY_LEVELS.DESTRUCTIVE,
  saveSchoolyearDataOfClass: SAFETY_LEVELS.DESTRUCTIVE,
  removeCoAccount: SAFETY_LEVELS.DESTRUCTIVE,

  // CRITICAL - System-level changes
  delUser: SAFETY_LEVELS.CRITICAL, // Deletes users permanently
  delClass: SAFETY_LEVELS.CRITICAL, // Deletes classes permanently
  clearGroup: SAFETY_LEVELS.CRITICAL, // Removes all users from group
  unregisterStudent: SAFETY_LEVELS.CRITICAL, // Unregisters students
  startSkoreSync: SAFETY_LEVELS.CRITICAL, // System synchronization
  deactivateTwoFactorAuthentication: SAFETY_LEVELS.CRITICAL,
};

/**
 * Get safety warnings for a method
 */
function getSafetyWarning(
  methodName: string,
  safetyLevel: SafetyLevel,
): string {
  const warnings = {
    [SAFETY_LEVELS.SAFE]: "",
    [SAFETY_LEVELS.MODERATE]:
      "⚠️  MODERATE RISK: This operation will modify data in Smartschool.",
    [SAFETY_LEVELS.DESTRUCTIVE]:
      "🔥 HIGH RISK: This operation will create, modify, or remove important data. Changes may be difficult to reverse.",
    [SAFETY_LEVELS.CRITICAL]:
      "💀 CRITICAL RISK: This operation can permanently delete data or affect system functionality. Use with extreme caution!",
  };

  const specificWarnings: Record<string, string> = {
    delUser: "💀 This will PERMANENTLY DELETE a user and all their data!",
    delClass:
      "💀 This will PERMANENTLY DELETE a class and all associated data!",
    clearGroup: "🔥 This will REMOVE ALL USERS from the specified group!",
    unregisterStudent: "🔥 This will UNREGISTER the student from the school!",
    startSkoreSync:
      "⚠️  This will start a system-wide synchronization process.",
    saveUser:
      "🔥 This will CREATE or MODIFY user accounts in the school system.",
    saveClass: "🔥 This will CREATE or MODIFY classes in the school system.",
  };

  const warning = warnings[safetyLevel];
  const specific = specificWarnings[methodName];

  return specific ? `${warning}\n${specific}` : warning;
}

/**
 * Check if a method requires user confirmation
 */
function requiresConfirmation(methodName: string): boolean {
  if (!REQUIRE_CONFIRMATION) return false;

  const safetyLevel = METHOD_SAFETY[methodName] || SAFETY_LEVELS.MODERATE;
  return (
    safetyLevel === SAFETY_LEVELS.DESTRUCTIVE ||
    safetyLevel === SAFETY_LEVELS.CRITICAL
  );
}

/**
 * Check if a method is allowed to run
 */
function isMethodAllowed(methodName: string): {
  allowed: boolean;
  reason?: string;
} {
  const safetyLevel = METHOD_SAFETY[methodName] || SAFETY_LEVELS.MODERATE;

  if (safetyLevel === SAFETY_LEVELS.CRITICAL && !ALLOW_DESTRUCTIVE) {
    return {
      allowed: false,
      reason:
        "🚫 CRITICAL operations are disabled. Set ALLOW_DESTRUCTIVE=true to enable.",
    };
  }

  if (safetyLevel === SAFETY_LEVELS.DESTRUCTIVE && !ALLOW_DESTRUCTIVE) {
    return {
      allowed: false,
      reason:
        "🚫 DESTRUCTIVE operations are disabled. Set ALLOW_DESTRUCTIVE=true to enable.",
    };
  }

  return { allowed: true };
}
const SMARTSCHOOL_CONVENTIONS = {
  // Username generation from names
  generateUsername: (firstName: string, lastName: string): string => {
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      .replace(/[^a-z.]/g, "") // Remove special characters
      .replace(/\s+/g, "."); // Replace spaces with dots
  },

  // Absence codes explanation
  absenceCodes: {
    "|": "Present - Student was in attendance",
    L: "Late - Student arrived late to class",
    Z: "Sick/Illness - Student was absent due to sickness",
    D: "Doctor - Student had medical appointment",
    B: "Known - Absence was notified in advance (excused)",
    R: "Unforeseen - Existential reason (family emergency, etc.)",
    "-": "Unknown - Unexplained/unexcused absence",
    G: "Spread - Spread of lesson program",
    C: "Topsport - Absence due to top sports activities",
    H: "Revalidation - Absence due to revalidation/therapy",
    O: "Childcare - Absence due to childcare responsibilities",
    Q: "Mourning - Absence due to mourning/bereavement",
    P: "Personal - Personal reasons for absence",
    W: "Internship work - Absence due to internship work",
    M: "Absent internship - Absence from internship work",
    J: "Maternity leave - Absence due to maternity leave",
    Y: "Suspension - Absence due to suspension",
    U: "Temporary termination - Temporary termination of student",
    T: "Termination - Termination of student",
    null: "No school/Holiday - Non-school day or holiday period",
  } as Record<string, string>,

  // User roles explanation
  userRoles: {
    leerling: "Student - A student enrolled in the school",
    leerkracht: "Teacher - A teaching staff member",
    directie: "Management - School management/administrative staff",
    andere: "Other - Other staff (secretary, janitor, etc.)",
  },

  // Co-account types
  coAccountTypes: {
    0: "Main account",
    1: "First co-account (often parent/guardian)",
    2: "Second co-account (often second parent/guardian)",
    3: "Third co-account",
    4: "Fourth co-account",
    5: "Fifth co-account",
    6: "Sixth co-account",
  },

  // School year format
  schoolYearFormat: (year: string): string => {
    return `School year ${year}-${parseInt(year) + 1}`;
  },

  // Common class naming patterns
  classPatterns: {
    examples: ["1A", "2B", "3C", "6WEWE", "STEM-GROUP-1"],
    explanation:
      "Classes typically follow patterns like [Grade][Section] (1A, 2B) or descriptive codes (STEM-GROUP-1)",
  },
};

/**
 * Enhanced context mapping for AI understanding
 * Maps method names to human-friendly descriptions and use cases
 */
const METHOD_CONTEXT: Record<
  string,
  {
    description: string;
    useCase: string;
    category: string;
    examples: string[];
    smartschoolContext?: string;
  }
> = {
  // User Management
  saveUser: {
    description: "Create or update a user account (student, teacher, staff)",
    useCase:
      "When you need to add new students/teachers or update existing user information",
    category: "User Management",
    examples: [
      "Add a new student to the school",
      "Update a teacher's email address",
    ],
    smartschoolContext: `Creates usernames from names automatically (e.g., 'John Doe' becomes 'john.doe'). 
    
User roles:
${Object.entries(SMARTSCHOOL_CONVENTIONS.userRoles)
  .map(([role, desc]) => `• '${role}': ${desc}`)
  .join("\n")}

For new users, username is typically generated as 'firstname.lastname' in lowercase.`,
  },
  getUserDetails: {
    description:
      "Get comprehensive user information including profile, groups, and co-accounts",
    useCase: "When you need to look up detailed information about a person",
    category: "User Information",
    examples: [
      "Find a student's contact details",
      "Check which classes a teacher belongs to",
    ],
    smartschoolContext:
      "Returns extensive user data including all co-accounts (parent/guardian accounts). If you only have a name like 'John Doe', the userIdentifier is typically 'john.doe'.",
  },
  getUserDetailsByUsername: {
    description: "Look up user details using their username",
    useCase:
      "When you only know someone's username but need their full profile",
    category: "User Information",
    examples: ["Find user info for 'john.doe'"],
    smartschoolContext:
      "Usernames in Smartschool typically follow the pattern 'firstname.lastname' (e.g., 'john.doe' for John Doe).",
  },
  getUserDetailsByNumber: {
    description: "Look up user details using their internal number",
    useCase: "When you have an internal ID and need user information",
    category: "User Information",
    examples: ["Get details for student #12345"],
  },
  delUser: {
    description: "Remove a user from the system permanently",
    useCase: "When a student graduates or staff member leaves",
    category: "User Management",
    examples: ["Remove graduated student", "Delete former teacher account"],
  },

  // Groups and Classes
  saveClass: {
    description: "Create or update a class/group in the school",
    useCase: "When setting up new academic years or reorganizing classes",
    category: "Class Management",
    examples: ["Create new '6A' class", "Update class description"],
  },
  saveGroup: {
    description: "Create or update student/teacher groups",
    useCase: "For organizing extracurricular activities or special groups",
    category: "Group Management",
    examples: ["Create 'Chess Club' group", "Set up 'Math Tutoring' group"],
  },
  saveUserToClass: {
    description: "Assign a student to a specific class",
    useCase: "When enrolling students or moving them between classes",
    category: "Class Assignment",
    examples: ["Move student to class 5B", "Assign new student to 1A"],
  },
  getClassTeachers: {
    description: "Find out which teachers are assigned to which classes",
    useCase: "To see class-teacher assignments and responsibilities",
    category: "Class Information",
    examples: ["Who teaches class 3A?", "Get all class assignments"],
  },
  delClass: {
    description: "Remove a class or group from the system",
    useCase: "When classes are no longer needed or reorganizing",
    category: "Class Management",
    examples: ["Delete old graduation class", "Remove unused group"],
  },

  // Communication
  sendMsg: {
    description: "Send messages to users (students, parents, teachers)",
    useCase: "For school communications and notifications",
    category: "Communication",
    examples: [
      "Send homework reminder",
      "Notify parents about event",
      "Message teacher about meeting",
    ],
    smartschoolContext: `Can send to main accounts or co-accounts (parent/guardian accounts). 
    
Co-account types:
${Object.entries(SMARTSCHOOL_CONVENTIONS.coAccountTypes)
  .map(([num, desc]) => `• ${num}: ${desc}`)
  .join("\n")}

Use coaccount=0 for main account (student/teacher), coaccount=1 for first parent, etc.`,
  },

  // Attendance & Absences
  getAbsents: {
    description: "Get student absence records for a school year",
    useCase: "To track attendance and identify patterns",
    category: "Attendance",
    examples: ["Check John's absences this year", "Generate attendance report"],
    smartschoolContext: `Returns absence data with codes for morning (am) and afternoon (pm). 
    
Absence codes mean:
${Object.entries(SMARTSCHOOL_CONVENTIONS.absenceCodes)
  .map(([code, desc]) => `• '${code}': ${desc}`)
  .join("\n")}

Example response: {"2024-09-01": {"am": "|", "pm": "Z"}} means present in morning, sick in afternoon.`,
  },
  getAbsentsByDate: {
    description: "See who was absent on a specific date",
    useCase: "To check daily attendance or investigate specific days",
    category: "Attendance",
    examples: ["Who was absent yesterday?", "Check attendance for Dec 15th"],
    smartschoolContext: `Shows all students' attendance for one date with absence codes. ${Object.keys(
      SMARTSCHOOL_CONVENTIONS.absenceCodes,
    )
      .slice(0, 5)
      .map(
        (code) =>
          `'${code}' = ${SMARTSCHOOL_CONVENTIONS.absenceCodes[code]?.split(" - ")[0] || "Unknown"}`,
      )
      .join(", ")}, etc.`,
  },

  // Administrative
  setAccountStatus: {
    description: "Change user account status (active, inactive, temporary)",
    useCase: "For managing account access and permissions",
    category: "Account Management",
    examples: ["Deactivate former student", "Temporarily disable account"],
  },
  savePassword: {
    description: "Set or change user passwords",
    useCase: "For password resets and initial account setup",
    category: "Account Management",
    examples: ["Reset forgotten password", "Set initial password for new user"],
  },
  changeUsername: {
    description: "Change a user's login username",
    useCase: "When users need different usernames",
    category: "Account Management",
    examples: ["Update username after name change"],
  },

  // Academic Records
  getStudentCareer: {
    description: "Get complete academic history of a student",
    useCase: "To see student's progression through grades and classes",
    category: "Academic Records",
    examples: ["Review student's school history", "Check grade progression"],
  },
  getSchoolyearDataOfClass: {
    description:
      "Get administrative details for a class in specific school year",
    useCase: "For academic planning and record keeping",
    category: "Academic Records",
    examples: ["Check class details for 2024-2025"],
  },
};

/**
 * Generate smart parameter schema from method name and context
 */
function generateParameterSchema(methodName: string): Record<string, any> {
  const baseParams: Record<string, any> = {};

  // Common patterns for parameter inference
  if (methodName.includes("User") || methodName.includes("Student")) {
    baseParams.userIdentifier = z.string().describe(`User identifier. Can be:
• Username (e.g., 'john.doe' for John Doe)
• Internal number (e.g., '12345') 
• Student ID
Note: Usernames typically follow 'firstname.lastname' pattern in lowercase.`);
  }

  if (methodName.includes("Class") || methodName.includes("Group")) {
    if (methodName.startsWith("save") || methodName.startsWith("get")) {
      if (methodName === "saveClass" || methodName === "saveGroup") {
        baseParams.name = z
          .string()
          .describe("Name of the class/group (e.g., '1A', '2B', 'Chess Club')");
        baseParams.desc = z.string().describe("Description of the class/group");
        baseParams.code = z
          .string()
          .describe(
            `Unique code identifier. Examples: ${SMARTSCHOOL_CONVENTIONS.classPatterns.examples.join(", ")}`,
          );
        baseParams.parent = z
          .string()
          .describe("Parent group/class code (use '0' for root level)");
        baseParams.untis = z
          .string()
          .optional()
          .describe("Untis timetable identifier");
      } else {
        baseParams.code = z
          .string()
          .optional()
          .describe(
            `Class or group code (${SMARTSCHOOL_CONVENTIONS.classPatterns.explanation})`,
          );
      }
    }
  }

  if (methodName.includes("Absent")) {
    if (methodName.includes("ByDate")) {
      baseParams.date = z
        .string()
        .describe("Date in YYYY-MM-DD format (e.g., '2024-12-15')");
    }
    if (methodName.includes("schoolYear") || methodName === "getAbsents") {
      baseParams.schoolYear = z
        .string()
        .describe(
          "School year as starting year (e.g., '2024' for school year 2024-2025)",
        );
    }
  }

  if (methodName === "sendMsg") {
    baseParams.title = z.string().describe("Message subject/title");
    baseParams.body = z.string().describe("Message content/body");
    baseParams.senderIdentifier = z
      .string()
      .optional()
      .describe(
        "Identifier of message sender (use 'Null' for system messages)",
      );
    baseParams.coaccount = z.number().optional()
      .describe(`Co-account to send to:
${Object.entries(SMARTSCHOOL_CONVENTIONS.coAccountTypes)
  .map(([num, desc]) => `• ${num}: ${desc}`)
  .join("\n")}`);
    baseParams.copyToLVS = z
      .boolean()
      .optional()
      .describe("Copy to student tracking system (LVS)");
  }

  if (methodName === "saveUser") {
    baseParams.username = z
      .string()
      .describe(
        "Username for login (typically 'firstname.lastname', e.g., 'john.doe')",
      );
    baseParams.name = z.string().describe("First name");
    baseParams.surname = z.string().describe("Last name");
    baseParams.basisrol = z.string().describe(`User role in school:
${Object.entries(SMARTSCHOOL_CONVENTIONS.userRoles)
  .map(([role, desc]) => `• '${role}': ${desc}`)
  .join("\n")}`);
    baseParams.email = z.string().email().optional().describe("Email address");
    baseParams.passwd1 = z
      .string()
      .optional()
      .describe("Initial password (user must change on first login)");

    // Add confirmation parameter for destructive operations
    if (requiresConfirmation(methodName)) {
      baseParams.confirmDestructiveAction = z
        .literal(true)
        .describe(
          "🔥 REQUIRED: Set to true to confirm this destructive operation",
        );
    }
  }

  if (methodName.includes("Password")) {
    baseParams.password = z
      .string()
      .optional()
      .describe("New password (must meet complexity requirements)");
    baseParams.accountType = z.number().optional().describe(`Account type:
${Object.entries(SMARTSCHOOL_CONVENTIONS.coAccountTypes)
  .map(([num, desc]) => `• ${num}: ${desc}`)
  .join("\n")}`);
  }

  // Add confirmation for critical operations
  if (
    methodName.startsWith("del") ||
    methodName === "clearGroup" ||
    methodName === "unregisterStudent"
  ) {
    baseParams.confirmDestructiveAction = z
      .literal(true)
      .describe(
        "💀 REQUIRED: Set to true to confirm this CRITICAL operation that may permanently delete data",
      );
  } else if (requiresConfirmation(methodName)) {
    baseParams.confirmDestructiveAction = z
      .literal(true)
      .describe(
        "🔥 REQUIRED: Set to true to confirm this destructive operation",
      );
  }

  // Add common optional parameters
  if (methodName.includes("official") || methodName.includes("Date")) {
    baseParams.officialDate = z
      .string()
      .optional()
      .describe(
        "Official date for the action (YYYY-MM-DD format). If not provided, may require manual confirmation in Smartschool.",
      );
  }

  return baseParams;
}

/**
 * Enhanced error handler with context
 */
function handleError(error: any, methodName: string) {
  let errorMessage = `Error in ${methodName}: `;

  if (error instanceof Error) {
    errorMessage += error.message;
  } else if (typeof error === "string") {
    errorMessage += error;
  } else {
    errorMessage += "An unexpected error occurred";
  }

  console.error("Tool execution error:", errorMessage);
  return {
    content: [{ type: "text" as const, text: errorMessage }],
    isError: true,
  };
}

/**
 * Auto-discover and register all SmartschoolClient methods as MCP tools
 */
function registerDynamicTools() {
  const clientPrototype = Object.getPrototypeOf(smartschoolClient);
  const methodNames = Object.getOwnPropertyNames(clientPrototype).filter(
    (name) => {
      // Only include public methods (not private, constructor, etc.)
      return (
        typeof clientPrototype[name] === "function" &&
        name !== "constructor" &&
        !name.startsWith("_") &&
        !name.includes("private") &&
        name !== "initialize"
      );
    },
  );

  console.error(`🔍 Discovered ${methodNames.length} Smartschool methods`);

  methodNames.forEach((methodName) => {
    const context = (METHOD_CONTEXT as any)[methodName] || {
      description: `Execute ${methodName} on Smartschool API`,
      useCase: "API method execution",
      category: "General",
      examples: [],
      smartschoolContext: "",
    };

    // Check if method is allowed
    const allowCheck = isMethodAllowed(methodName);
    if (!allowCheck.allowed) {
      console.error(`⚠️ Skipping ${methodName}: ${allowCheck.reason}`);
      return;
    }

    const safetyLevel = METHOD_SAFETY[methodName] || SAFETY_LEVELS.MODERATE;
    const safetyWarning = getSafetyWarning(methodName, safetyLevel);

    // Enhanced description for AI with Smartschool domain knowledge and safety info
    const enhancedDescription = `
${context.description}

🎯 Use Case: ${context.useCase}
📂 Category: ${context.category}
${context.examples.length > 0 ? `💡 Examples: ${context.examples.join(", ")}` : ""}
${context.smartschoolContext ? `\n🏫 Smartschool Context: ${context.smartschoolContext}` : ""}

${safetyWarning ? `\n${safetyWarning}` : ""}

🔧 Domain Knowledge:
• Smartschool is a Belgian school management system
• Usernames follow 'firstname.lastname' pattern (John Doe → john.doe)
• Classes use codes like '1A', '2B', or descriptive names like 'STEM-GROUP-1'
• Co-accounts are for parents/guardians (coaccount 1 = first parent, 2 = second parent)
• School years are referenced by starting year (2024 = 2024-2025 school year)

This method interacts with the Smartschool school management system for managing students, teachers, classes, attendance, communications, and administrative tasks.
    `.trim();

    const parameterSchema = generateParameterSchema(methodName);

    server.tool(
      `smartschool-${methodName}`,
      enhancedDescription,
      parameterSchema,
      async (params) => {
        try {
          console.error(
            `🚀 Executing ${methodName} with params:`,
            JSON.stringify(params, null, 2),
          );

          // Smart parameter processing for common patterns
          if (
            params.userIdentifier &&
            typeof params.userIdentifier === "string"
          ) {
            // If userIdentifier looks like a full name, suggest username format
            if (
              params.userIdentifier.includes(" ") &&
              !params.userIdentifier.includes(".")
            ) {
              const [firstName, ...lastNameParts] =
                params.userIdentifier.split(" ");
              const lastName = lastNameParts.join(" ");
              const suggestedUsername =
                SMARTSCHOOL_CONVENTIONS.generateUsername(firstName, lastName);
              console.error(
                `💡 Tip: Name "${params.userIdentifier}" detected. Suggested username: "${suggestedUsername}"`,
              );
              params.userIdentifier = suggestedUsername;
            }
          }

          // Call the method dynamically
          const result = await (smartschoolClient as any)[methodName](params);

          // Handle different response types with enhanced formatting
          if (result === true) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `✅ ${methodName} completed successfully`,
                },
              ],
            };
          } else if (typeof result === "object" && result !== null) {
            let formattedResult = JSON.stringify(result, null, 2);

            // Add absence code explanations if this is an absence-related response
            if (methodName.includes("Absent") && typeof result === "object") {
              const resultStr = JSON.stringify(result);
              const foundCodes = Object.keys(
                SMARTSCHOOL_CONVENTIONS.absenceCodes,
              ).filter(
                (code) => code !== "null" && resultStr.includes(`"${code}"`),
              );

              if (foundCodes.length > 0) {
                const explanations = foundCodes
                  .map(
                    (code) =>
                      `• '${code}': ${SMARTSCHOOL_CONVENTIONS.absenceCodes[code]}`,
                  )
                  .join("\n");

                formattedResult += `\n\n📚 Absence Code Explanations:\n${explanations}`;
              }
            }

            return {
              content: [
                {
                  type: "text" as const,
                  text: `📊 ${methodName} result:\n${formattedResult}`,
                },
              ],
            };
          } else {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `📝 ${methodName} returned: ${result}`,
                },
              ],
            };
          }
        } catch (error) {
          return handleError(error, methodName);
        }
      },
    );
  });

  console.error(
    `✅ Registered ${methodNames.length} dynamic Smartschool tools`,
  );
}

/**
 * Main function
 */
async function main() {
  console.error("🏫 Starting Dynamic Smartschool MCP Server...");
  console.error(`🛡️ Safety Settings:`);
  console.error(
    `   - Destructive operations: ${ALLOW_DESTRUCTIVE ? "✅ ENABLED" : "🚫 DISABLED"}`,
  );
  console.error(
    `   - Confirmation required: ${REQUIRE_CONFIRMATION ? "✅ YES" : "❌ NO"}`,
  );
  console.error(
    `   - Set ALLOW_DESTRUCTIVE=true to enable destructive operations`,
  );
  console.error(
    `   - Set REQUIRE_CONFIRMATION=false to disable confirmation prompts`,
  );

  // Register all discovered tools
  registerDynamicTools();

  // Start server
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("🚀 Dynamic Smartschool MCP Server running on stdio");
    console.error(`📚 Server initialized successfully`);

    // Keep server running
    await new Promise<void>((resolve) => {
      process.on("SIGINT", () => {
        console.error("🛑 Shutting down gracefully...");
        resolve();
      });
      process.on("SIGTERM", () => {
        console.error("🛑 Shutting down gracefully...");
        resolve();
      });
    });
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Fatal error in main():", error);
  process.exit(1);
});
