/**
 * Code Generation Prompt Templates
 * Language-specific templates for LLM code generation
 */

import type { Task } from '@omaikit/models';

export class PromptTemplates {
  /**
   * Generate a prompt for code generation
   */
  async generatePrompt(task: Task, projectContext: any, plan: any, language: string): Promise<string> {
    const basePrompt = this.getBasePrompt(language);
    const styleGuide = this.extractStyleGuide(projectContext, language);
    const examples = this.getExamples(language);

    return `
${basePrompt}

## Task Details
Title: ${task.title}
Description: ${task.description}
Type: ${task.type}
Estimated Effort: ${task.estimatedEffort} hours

## Acceptance Criteria
${task.acceptanceCriteria.map((c) => `- ${c}`).join('\n')}

## Code Style Guide
${styleGuide}

## Examples
${examples}

## Requirements
1. Write production-ready code with proper error handling
2. Include logging statements for debugging
3. Add type annotations/documentation
4. Follow the project's naming conventions
5. Ensure the code is testable and maintainable
6. Include comments for complex logic

## Output Format
Provide the generated code as a single response with file paths and content.
`;
  }

  private getBasePrompt(language: string): string {
    const prompts: Record<string, string> = {
      typescript: `You are a TypeScript code generation expert. Generate TypeScript code that:
- Uses strict typing and interfaces
- Follows functional programming principles when appropriate
- Uses async/await for asynchronous operations
- Includes comprehensive error handling with try-catch blocks
- Uses a logger for info/warn/error logging`,

      javascript: `You are a JavaScript code generation expert. Generate JavaScript code that:
- Uses modern ES6+ syntax
- Includes proper error handling with try-catch blocks
- Uses console or logger for logging
- Is well-structured and maintainable`,

      python: `You are a Python code generation expert. Generate Python code that:
- Follows PEP 8 style guidelines
- Uses type hints for function arguments and returns
- Includes docstrings for all modules, classes, and functions
- Uses exception handling with try-except blocks
- Uses Python's logging module for logging`,

      go: `You are a Go code generation expert. Generate Go code that:
- Uses idiomatic Go patterns
- Follows the effective Go guidelines
- Returns errors explicitly
- Uses the log package for logging
- Includes proper error handling`,

      rust: `You are a Rust code generation expert. Generate Rust code that:
- Uses idiomatic Rust patterns
- Leverages the type system for safety
- Uses Result<T, E> for error handling
- Includes proper documentation comments
- Uses the log crate for logging`,

      csharp: `You are a C# code generation expert. Generate C# code that:
- Follows C# naming conventions (PascalCase for public, camelCase for private)
- Uses nullable reference types
- Includes XML documentation comments
- Uses exception handling with try-catch blocks
- Uses ILogger for logging`,
    };

    return prompts[language] || prompts.typescript;
  }

  private extractStyleGuide(projectContext: any, language: string): string {
    if (!projectContext?.codePatterns) {
      return this.getDefaultStyleGuide(language);
    }

    const patterns = projectContext.codePatterns;
    const convention = patterns.namingConventions || {};
    const errorHandling = patterns.errorHandling?.pattern || 'try-catch';
    const docFormat = patterns.comments?.docstringFormat || 'jsdoc';

    return `
- Naming Convention: ${convention.casing || 'camelCase'}
- Error Handling: ${errorHandling}
- Documentation Format: ${docFormat}
- Comment Coverage: ${patterns.comments?.commentCoverage || 50}%
- Module Organization: ${patterns.structuralPattern?.organizationStyle || 'by-feature'}
`;
  }

  private getDefaultStyleGuide(language: string): string {
    const guides: Record<string, string> = {
      typescript: `
- Naming: camelCase for variables/functions, PascalCase for classes/interfaces
- Use const by default, let when needed
- Use interface for object types, type for unions
- Use strict null checks
- Max line length: 100 characters
- Use 2-space indentation`,

      javascript: `
- Naming: camelCase for variables/functions, PascalCase for constructors
- Use const by default, let when needed
- Use arrow functions for callbacks
- Max line length: 100 characters
- Use 2-space indentation`,

      python: `
- Follow PEP 8 guidelines
- Use snake_case for functions and variables
- Use UPPER_CASE for constants
- Max line length: 100 characters
- Use 4-space indentation`,

      go: `
- Use CamelCase for exported identifiers
- Use mixedCase for unexported identifiers
- Keep packages small and focused
- Use descriptive variable names
- Tab indentation`,

      rust: `
- Use snake_case for functions and variables
- Use CamelCase for types and traits
- Use SCREAMING_SNAKE_CASE for constants
- Keep modules organized
- 4-space indentation`,

      csharp: `
- Use PascalCase for public members
- Use camelCase for private members
- Use PascalCase for namespaces
- Use XML documentation for public types
- 4-space indentation`,
    };

    return guides[language] || guides.typescript;
  }

  private getExamples(language: string): string {
    const examples: Record<string, string> = {
      typescript: `
## Example TypeScript Code
\`\`\`typescript
import { Logger } from './logger';

const logger = new Logger('ModuleName');

export interface User {
  id: string;
  name: string;
  email: string;
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  try {
    logger.info('Creating new user', { email: userData.email });
    
    // Validation
    if (!userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }
    
    const user: User = {
      id: generateId(),
      ...userData,
    };
    
    logger.info('User created successfully', { userId: user.id });
    return user;
  } catch (error) {
    logger.error('Failed to create user', { error, userData });
    throw error;
  }
}
\`\`\``,

      python: `
## Example Python Code
\`\`\`python
import logging
from typing import TypedDict, Optional

logger = logging.getLogger(__name__)

class User(TypedDict):
    id: str
    name: str
    email: str

def create_user(user_data: dict) -> User:
    """
    Create a new user with the provided data.
    
    Args:
        user_data: Dictionary containing user information
        
    Returns:
        User: The created user object
        
    Raises:
        ValueError: If user data is invalid
    """
    try:
        logger.info(f"Creating new user: {user_data['email']}")
        
        # Validation
        if '@' not in user_data.get('email', ''):
            raise ValueError('Invalid email format')
        
        user: User = {
            'id': generate_id(),
            **user_data
        }
        
        logger.info(f"User created: {user['id']}")
        return user
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise
\`\`\``,

      go: `
## Example Go Code
\`\`\`go
package users

import (
    "fmt"
    "log"
)

type User struct {
    ID    string
    Name  string
    Email string
}

func CreateUser(userData map[string]string) (*User, error) {
    log.Println("Creating new user")
    
    // Validation
    if userData["email"] == "" {
        return nil, fmt.Errorf("email is required")
    }
    
    user := &User{
        ID:    generateID(),
        Name:  userData["name"],
        Email: userData["email"],
    }
    
    log.Printf("User created: %s", user.ID)
    return user, nil
}
\`\`\``,

      rust: `
## Example Rust Code
\`\`\`rust
use log::{info, error};

#[derive(Debug, Clone)]
pub struct User {
    pub id: String,
    pub name: String,
    pub email: String,
}

pub fn create_user(name: String, email: String) -> Result<User, String> {
    info!("Creating new user: {}", email);
    
    // Validation
    if !email.contains('@') {
        return Err("Invalid email format".to_string());
    }
    
    let user = User {
        id: generate_id(),
        name,
        email,
    };
    
    info!("User created: {}", user.id);
    Ok(user)
}
\`\`\``,

      csharp: `
## Example C# Code
\`\`\`csharp
using Microsoft.Extensions.Logging;
using System;

public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

public class UserService
{
    private readonly ILogger<UserService> _logger;
    
    public UserService(ILogger<UserService> logger)
    {
        _logger = logger;
    }
    
    public User CreateUser(string name, string email)
    {
        try
        {
            _logger.LogInformation("Creating new user: {Email}", email);
            
            if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            {
                throw new ArgumentException("Invalid email format");
            }
            
            var user = new User
            {
                Id = GenerateId(),
                Name = name,
                Email = email
            };
            
            _logger.LogInformation("User created: {UserId}", user.Id);
            return user;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create user");
            throw;
        }
    }
}
\`\`\``,
    };

    return examples[language] || examples.typescript;
  }
}
