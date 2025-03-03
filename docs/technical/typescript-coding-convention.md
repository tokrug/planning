# Typescript coding conventions in Front module

## Typing

Every function parameter should be typed. The function return type must be typed as well.

For every data structure define a Typescript interface.

Avoid the `any` type.

Do not use inline type definitions. Instead define a dedicated interface and reference it in other interfaces. Exceptions:
* simple function signatures do not require a dedicated interface and types can be inlined

## Folder structure

Separate files into folders by feature e.g. reporting, workflow, entity CRUD. Do NOT split files into folders by layer e.g. model, controller, repository.

## Functions

Functions should be relatively small. If function is too complex it should be split into smaller functions.

Function name should reflect the goal of the function. 

Functions should have a single responsibility.

Related functions should be kept in the same file.

## Code comments

Always use JSDoc comments.

Each function and each class should be documented. Exceptions:
* simple utility functions shared across the project and not representing any particular business requirement / acceptance criteria. 

Documentation should focus on the function goal, intent and contract. Less on the implementation details unless they're important for the calling code.

In the documentation include information which will make it easier for LLMs to understand the code and add new features in the future.

If relevant include reference to the acceptance criteria implemented in that function.

## File name

All file names are using the kebab case e.g. typescript-coding-convention.md.



