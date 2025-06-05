# Smartschool MCP Server 🏫

A dynamic Model Context Protocol (MCP) server that provides AI assistants with secure access to Smartschool APIs. This server automatically discovers all available Smartschool methods and exposes them as MCP tools with comprehensive safety guardrails.

## ✨ Features

- 🔄 **Dynamic Auto-Discovery**: Automatically detects all Smartschool API methods
- 🛡️ **Enterprise Safety**: Multi-level protection against destructive operations
- 🧠 **AI-Optimized**: Rich context and domain knowledge for better AI understanding
- 🚀 **Future-Proof**: Adapts automatically when Smartschool SDK updates
- 📚 **Domain Expert**: Built-in knowledge of Belgian school systems and conventions
- ⚡ **Zero Maintenance**: No manual tool definitions required

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or compatible JavaScript runtime
- Access to a Smartschool instance
- Valid Smartschool API credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/AbriantoLabs/smartschool-mcp.git
cd smartschool-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Set up your environment variables:

```bash
# Required: Smartschool API Configuration
export SMARTSCHOOL_API_ENDPOINT="https://your-school.smartschool.be/Webservices/V3"
export SMARTSCHOOL_ACCESS_CODE="your-access-code"

# Optional: Safety Configuration
export ALLOW_DESTRUCTIVE=false          # Enable destructive operations
export REQUIRE_CONFIRMATION=true        # Require confirmation for risky operations
```

### Running the Server

```bash
# Direct execution
node build/mod.js

# Or via npm script
npm start
```

## 🔧 Usage with AI Assistants

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "smartschool": {
      "command": "node",
      "args": ["/path/to/smartschool-mcp-server/build/mod.js"],
      "env": {
        "SMARTSCHOOL_API_ENDPOINT": "https://your-school.smartschool.be/Webservices/V3",
        "SMARTSCHOOL_ACCESS_CODE": "your-access-code",
        "ALLOW_DESTRUCTIVE": "false",
        "REQUIRE_CONFIRMATION": "true"
      }
    }
  }
}
```

### Other MCP-Compatible AI Systems

The server communicates via stdio and follows the MCP specification. Configure your AI system to:

1. Launch the server as a subprocess
2. Connect via stdin/stdout 
3. Set the required environment variables

## 🛡️ Safety System

The server implements a comprehensive 4-level safety classification:

### Safety Levels

| Level | Description | Examples | Behavior |
|-------|-------------|----------|----------|
| 🟢 **SAFE** | Read-only operations | `getUserDetails`, `getAbsents` | No restrictions |
| 🟡 **MODERATE** | Reversible changes | `sendMsg`, `savePassword` | Always allowed |
| 🔥 **DESTRUCTIVE** | High-impact changes | `saveUser`, `saveClass` | Requires `ALLOW_DESTRUCTIVE=true` |
| 💀 **CRITICAL** | Permanent deletions | `delUser`, `delClass` | Requires `ALLOW_DESTRUCTIVE=true` |

### Confirmation System

Destructive and critical operations require explicit confirmation:

```javascript
// This will be blocked without confirmation
{
  "username": "john.doe",
  "name": "John",
  "surname": "Doe",
  "basisrol": "leerling"
}

// This will execute (with confirmDestructiveAction)
{
  "username": "john.doe", 
  "name": "John",
  "surname": "Doe",
  "basisrol": "leerling",
  "confirmDestructiveAction": true  // ← Required!
}
```

### Environment Controls

```bash
# Production (safe defaults)
export ALLOW_DESTRUCTIVE=false      # Blocks destructive operations
export REQUIRE_CONFIRMATION=true    # Requires explicit confirmation

# Development (more permissive)
export ALLOW_DESTRUCTIVE=true       # Allows all operations
export REQUIRE_CONFIRMATION=false   # No confirmation required (not recommended)
```

## 🧠 AI Context & Domain Knowledge

The server provides rich context to help AI understand Smartschool conventions:

### Username Conventions
- **Pattern**: `firstname.lastname` (e.g., "John Doe" → "john.doe")
- **Auto-conversion**: Names automatically converted to usernames
- **Smart suggestions**: Helpful tips when name-like input detected

### Absence Codes
Comprehensive explanation of Belgian school absence codes:

| Code | Meaning | Description |
|------|---------|-------------|
| `\|` | Present | Student was in attendance |
| `L` | Late | Student arrived late |
| `Z` | Sick | Absent due to illness |
| `D` | Doctor | Medical appointment |
| `B` | Known | Pre-notified absence |
| `R` | Unforeseen | Emergency/family reasons |
| `-` | Unknown | Unexplained absence |

*[See full list in code for all 20+ codes]*

### User Roles
- `leerling`: Student
- `leerkracht`: Teacher  
- `directie`: Management/Administration
- `andere`: Other staff

### Co-Account System
- `0`: Main account (student/teacher)
- `1`: First co-account (typically first parent)
- `2`: Second co-account (typically second parent)
- `3-6`: Additional co-accounts

## 📚 Available Operations

The server automatically exposes all Smartschool API methods. Here are some key categories:

### 👥 User Management
- `getUserDetails` - Get comprehensive user information
- `saveUser` - Create or update users *(Destructive)*
- `delUser` - Delete users permanently *(Critical)*
- `setAccountStatus` - Activate/deactivate accounts
- `savePassword` - Set/change passwords

### 🏛️ Classes & Groups  
- `getClassTeachers` - List class-teacher assignments
- `saveClass` - Create/modify classes *(Destructive)*
- `saveUserToClass` - Assign students to classes
- `delClass` - Delete classes permanently *(Critical)*

### 📬 Communication
- `sendMsg` - Send messages to users/parents
- `saveSignature` - Set email signatures

### 📊 Attendance & Reporting
- `getAbsents` - Get student absence records
- `getAbsentsByDate` - Daily attendance reports
- `getStudentCareer` - Academic history

### ⚙️ Administration
- `startSkoreSync` - System synchronization *(Critical)*
- `addHelpdeskTicket` - Create support tickets
- `getAllAccountsExtended` - Bulk user data export

## 🔍 Example Interactions

### Safe Operations (No confirmation needed)

```bash
# Get student details by name (auto-converts to username)
{
  "tool": "smartschool-getUserDetails",
  "params": {
    "userIdentifier": "John Doe"  # Becomes "john.doe"
  }
}

# Check attendance for a date  
{
  "tool": "smartschool-getAbsentsByDate", 
  "params": {
    "date": "2024-12-15"
  }
}
```

### Destructive Operations (Confirmation required)

```bash
# Create a new student (requires confirmation)
{
  "tool": "smartschool-saveUser",
  "params": {
    "username": "jane.smith",
    "name": "Jane", 
    "surname": "Smith",
    "basisrol": "leerling",
    "email": "jane.smith@student.school.be",
    "confirmDestructiveAction": true  # Required!
  }
}
```

### Critical Operations (Extreme caution)

```bash
# Delete a user (requires ALLOW_DESTRUCTIVE=true + confirmation)
{
  "tool": "smartschool-delUser",
  "params": {
    "userIdentifier": "former.student", 
    "confirmDestructiveAction": true  # Required!
  }
}
```

## 🚨 Error Handling

The server provides comprehensive error handling:

### Safety Blocks
```
🚫 Operation blocked: saveUser requires confirmation.

🔥 HIGH RISK: This operation will create, modify, or remove important data. 
Changes may be difficult to reverse.

To proceed, add: confirmDestructiveAction: true
```

### Configuration Errors
```
⚠️ Skipping delUser: 🚫 CRITICAL operations are disabled. 
Set ALLOW_DESTRUCTIVE=true to enable.
```

### API Errors
```
Error in getUserDetails: Invalid username or user not found
```

## 🔧 Development

### Project Structure

```
smartschool-mcp-server/
├── src/
│   └── mod.ts              # Main server implementation
├── build/                  # Compiled JavaScript
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

### Building

```bash
# Development build
npm run build

# Watch mode (for development)
npm run dev

# Type checking
npm run type-check
```

### Adding Custom Context

To enhance AI understanding for specific methods, edit the `METHOD_CONTEXT` object:

```typescript
const METHOD_CONTEXT = {
  yourMethodName: {
    description: "Human-friendly description",
    useCase: "When to use this method", 
    category: "Logical grouping",
    examples: ["Example use case 1", "Example 2"],
    smartschoolContext: "Smartschool-specific details"
  }
};
```

### Safety Classification

To modify safety levels, update the `METHOD_SAFETY` object:

```typescript
const METHOD_SAFETY = {
  yourMethodName: SAFETY_LEVELS.DESTRUCTIVE,  // or SAFE, MODERATE, CRITICAL
};
```

## 📋 Requirements

### System Requirements
- Node.js 18.0.0 or higher
- 256MB+ available memory
- Network access to Smartschool API endpoint

### Smartschool Requirements
- Active Smartschool instance
- API access enabled
- Valid access code with appropriate permissions

### Permissions

The MCP server requires Smartschool API access with permissions for:

- **User management** (for user operations)
- **Group/class management** (for organizational operations)  
- **Messaging** (for communication features)
- **Reporting** (for attendance/academic data)

Consult your Smartschool administrator for proper API access configuration.

## 🔒 Security Considerations

### Production Deployment

1. **Environment Variables**: Never commit credentials to version control
2. **Access Control**: Restrict `ALLOW_DESTRUCTIVE` in production
3. **Monitoring**: Log all destructive operations
4. **Backup**: Ensure database backups before bulk operations
5. **Testing**: Thoroughly test in development environment first

### API Security

- API access codes should be rotated regularly
- Monitor API usage for unusual patterns
- Implement rate limiting if needed
- Use HTTPS endpoints only

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Add appropriate safety classifications for new methods
- Update documentation for significant changes
- Test with multiple Smartschool configurations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

### Getting Help

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Open a GitHub issue for bugs or feature requests
3. **Discussions**: Use GitHub Discussions for questions
4. **Smartschool Support**: Contact your Smartschool administrator for API access issues

### Common Issues

**Server won't start**
- Check environment variables are set correctly
- Verify Node.js version compatibility
- Ensure Smartschool API endpoint is accessible

**Operations being blocked**
- Check `ALLOW_DESTRUCTIVE` setting
- Verify `confirmDestructiveAction` parameter for destructive operations
- Review safety level classifications

**AI not understanding context**
- Check method descriptions in `METHOD_CONTEXT`
- Verify domain knowledge sections are accurate
- Consider adding method-specific examples

## 🙏 Acknowledgments

### Abrianto & Smartschool-Kit

This MCP server is built on top of the excellent **[@abrianto/smartschool-kit](https://jsr.io/@abrianto/smartschool-client)** library, created by [**Abrianto**](https://github.com/AbriantoLabs). 

**Abrianto** is a technology company focused on creating developer-friendly tools and APIs for educational systems. Their work bridges the gap between complex school management platforms and modern development practices.

#### About Smartschool-Kit

The `@abrianto/smartschool-kit` library provides:

- 🚀 **Runtime Agnostic**: Works in Deno, Browser, and Node.js environments
- 💪 **Full TypeScript Support**: Comprehensive type definitions for all endpoints
- 🔧 **CLI Interface**: Command-line tools for quick operations
- 🎯 **Complete API Coverage**: Supports all Smartschool API endpoints
- 📘 **Excellent Documentation**: Detailed examples and method descriptions

```bash
# Install the underlying library
npm install @abrianto/smartschool-kit

# Or from JSR
jsr add @abrianto/smartschool-client
```

<!--
## 🚀 Roadmap

- [ ] GraphQL endpoint support
- [ ] Bulk operation optimization
- [ ] Advanced error recovery
- [ ] Performance monitoring
- [ ] Multi-tenant support
- [ ] Real-time change notifications
-->

---

**Made with ❤️ for the education community by [Abrianto](https://github.com/AbriantoLabs)**

*This MCP server bridges the gap between AI assistants and school management systems, enabling natural language interaction with complex educational data while maintaining the highest safety standards.*
