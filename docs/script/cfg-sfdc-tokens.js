/**
 * Salesforce Formula Tokenizer and Syntax Highlighter
 * A clean, stepwise approach to formula highlighting
 */

/**
 * Token types for Salesforce formulas
 */
const TOKEN_TYPES = {
  FUNCTION: "function",
  FIELD: "field",
  NESTED_FIELD: "nested_field", // For [Account].[Name] or [Account.Name]
  CUSTOM_FUNCTION: "custom_function", // For custom Apex functions
  FORMULA_FIELD: "formula_field", // For references to other formula fields
  OPERATOR: "operator",
  STRING: "string",
  NUMBER: "number",
  CONSTANT: "constant",
  PARENTHESIS: "parenthesis",
  BRACKET: "bracket",
  COMMA: "comma",
  WHITESPACE: "whitespace",
  IDENTIFIER: "identifier",
  COMMENT: "comment",
  ERROR: "error", // For syntax errors or invalid functions
  DOT: "dot", // For dot notation in nested fields
};

/**
 * Salesforce formula keywords and functions
 */
const SF_KEYWORDS = {
  // Logical functions
  logical: [
    "AND",
    "OR",
    "NOT",
    "IF",
    "CASE",
    "SWITCH",
    "ISNULL",
    "ISBLANK",
    "ISNUMBER",
    "ISTEXT",
    "ISCHANGED",
    "PRIORVALUE",
    "XOR",
    "NAND",
    "NOR",
    "ISNULL",
    "ISBLANK",
    "ISNUMBER",
    "ISTEXT",
    "ISDATE",
    "ISCHANGED",
    "PRIORVALUE",
  ],

  // Text functions
  text: [
    "TEXT",
    "LEFT",
    "RIGHT",
    "MID",
    "LEN",
    "FIND",
    "SUBSTITUTE",
    "TRIM",
    "UPPER",
    "LOWER",
    "PROPER",
    "BR",
    "HYPERLINK",
    "IMAGE",
    "VALUE",
    "CONTAINS",
    "BEGINS",
    "CONTAINS",
    "INCLUDES",
    "EXCLUDES",
    "REGEX",
    "REGEX_REPLACE",
    "SPLIT",
    "JOIN",
    "REPLACE",
    "SUBSTITUTE",
    "REPT",
    "CLEAN",
    "CODE",
    "CHAR",
    "UNICHAR",
    "UNICODE",
  ],

  // Math functions
  math: [
    "ABS",
    "CEILING",
    "FLOOR",
    "ROUND",
    "MOD",
    "MAX",
    "MIN",
    "SQRT",
    "EXP",
    "LN",
    "LOG",
    "POWER",
    "RAND",
    "SIN",
    "COS",
    "TAN",
    "ASIN",
    "ACOS",
    "ATAN",
    "PI",
    "DEGREES",
    "RADIANS",
    "SIGN",
    "FACT",
    "GCD",
    "LCM",
  ],

  // Date/Time functions
  datetime: [
    "TODAY",
    "NOW",
    "DATE",
    "DATETIMEVALUE",
    "DATEVALUE",
    "YEAR",
    "MONTH",
    "DAY",
    "HOUR",
    "MINUTE",
    "SECOND",
    "WEEKDAY",
    "ADDMONTHS",
    "MONTHS_BETWEEN",
    "DAYS_BETWEEN",
    "HOURS_BETWEEN",
    "MINUTES_BETWEEN",
    "SECONDS_BETWEEN",
    "DATEADD",
    "DATEDIFF",
    "DATETIME_FORMAT",
    "TIMEVALUE",
    "TIMENOW",
    "TIMETONUM",
    "NUMTOTIME",
    "CALENDAR_MONTH",
    "CALENDAR_QUARTER",
    "CALENDAR_YEAR",
    "FISCAL_MONTH",
    "FISCAL_QUARTER",
    "FISCAL_YEAR",
  ],

  // Type conversion and validation
  conversion: [
    "VALUE",
    "TEXT",
    "BLANKVALUE",
    "NULLVALUE",
    "CURRENCY",
    "NUMBER",
    "DOUBLE",
    "INT",
    "LONG",
    "ISNULL",
    "ISBLANK",
    "ISNUMBER",
    "ISTEXT",
    "ISDATE",
    "ISCHANGED",
    "PRIORVALUE",
  ],

  // Advanced functions
  advanced: [
    "CASE",
    "SWITCH",
    "CHOOSE",
    "COALESCE",
    "IFNULL",
    "NVL",
    "DECODE",
    "GREATEST",
    "LEAST",
    "RANK",
    "DENSE_RANK",
    "ROW_NUMBER",
    "LAG",
    "LEAD",
    "FIRST_VALUE",
    "LAST_VALUE",
  ],

  // Constants
  constants: ["TRUE", "FALSE", "NULL", "BLANK", "EMPTY"],
};

/**
 * Operators for Salesforce formulas
 * Note: Multi-character operators must come before single-character ones
 */
const OPERATORS = [
  "<=",
  ">=",
  "<>",
  "&&",
  "||",
  "=",
  "<",
  ">",
  "+",
  "-",
  "*",
  "/",
  "&",
];

/**
 * Prettifies a Salesforce formula by applying consistent formatting
 * @param {string} formula - The raw Salesforce formula
 * @returns {string} - The prettified formula
 */
function prettifySalesforceFormula(formula) {
  if (!formula || typeof formula !== "string") {
    return formula;
  }

  let result = formula.trim();

  // Use a more robust approach: replace multi-character operators with unique tokens
  // that won't be matched by single-character regex
  const multiCharOps = [
    { pattern: /<=/g, replacement: "___LESS_EQUAL___" },
    { pattern: />=/g, replacement: "___GREATER_EQUAL___" },
    { pattern: /<>/g, replacement: "___NOT_EQUAL___" },
    { pattern: /&&/g, replacement: "___AND___" },
    { pattern: /\|\|/g, replacement: "___OR___" },
  ];

  // Step 1: Protect multi-character operators
  multiCharOps.forEach(({ pattern, replacement }) => {
    result = result.replace(pattern, replacement);
  });

  // Step 2: Process single-character operators
  // First, add spaces around all single-character operators
  result = result
    .replace(/\s*=\s*/g, " = ")
    .replace(/\s*>\s*/g, " > ")
    .replace(/\s*<\s*/g, " < ")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s*\*\s*/g, " * ")
    .replace(/\s*\/\s*/g, " / ");

  // Step 3: Process parentheses and commas
  result = result.replace(/\s*([(),])\s*/g, "$1 ");

  // Step 4: Normalize whitespace
  result = result.replace(/\s+/g, " ");

  // Step 5: Restore multi-character operators and fix any that got split
  result = result
    .replace(/___LESS_EQUAL___/g, " <= ")
    .replace(/___GREATER_EQUAL___/g, " >= ")
    .replace(/___NOT_EQUAL___/g, " <> ")
    .replace(/___AND___/g, " && ")
    .replace(/___OR___/g, " || ")
    // Fix any multi-character operators that got split during single-char processing
    .replace(/>\s*=/g, " >= ")
    .replace(/<\s*=/g, " <= ")
    .replace(/<\s*>/g, " <> ")
    .replace(/&\s*&/g, " && ")
    .replace(/\|\s*\|/g, " || ");

  // Step 6: Final whitespace normalization
  result = result.replace(/\s+/g, " ").trim();

  // Capitalize function names
  const allFunctions = [
    ...SF_KEYWORDS.logical,
    ...SF_KEYWORDS.text,
    ...SF_KEYWORDS.math,
    ...SF_KEYWORDS.datetime,
    ...SF_KEYWORDS.conversion,
  ];

  allFunctions.forEach((func) => {
    const regex = new RegExp(`\\b${func}\\b`, "gi");
    result = result.replace(regex, func.toUpperCase());
  });

  // Capitalize constants
  SF_KEYWORDS.constants.forEach((constant) => {
    const regex = new RegExp(`\\b${constant}\\b`, "gi");
    result = result.replace(regex, constant.toUpperCase());
  });

  // Add proper spacing around parentheses
  result = result
    .replace(/\s*\(\s*/g, " (")
    .replace(/\s*\)\s*/g, ") ")
    .replace(/\s+/g, " ")
    .trim();

  return result;
}

/**
 * Tokenizes a Salesforce formula into an array of tokens
 * @param {string} formula - The Salesforce formula to tokenize
 * @returns {Array} Array of token objects with type, value, and position
 */
function tokenizeFormula(formula) {
  if (!formula || typeof formula !== "string") {
    return [];
  }

  const tokens = [];
  let position = 0;
  const length = formula.length;

  while (position < length) {
    const char = formula[position];

    // Skip whitespace
    if (/\s/.test(char)) {
      let whitespace = "";
      while (position < length && /\s/.test(formula[position])) {
        whitespace += formula[position];
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.WHITESPACE,
        value: whitespace,
        start: position - whitespace.length,
        end: position,
      });
      continue;
    }

    // Handle strings (double quotes)
    if (char === '"') {
      let string = '"';
      position++;
      while (position < length && formula[position] !== '"') {
        if (formula[position] === "\\" && position + 1 < length) {
          string += formula[position] + formula[position + 1];
          position += 2;
        } else {
          string += formula[position];
          position++;
        }
      }
      if (position < length) {
        string += '"';
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.STRING,
        value: string,
        start: position - string.length,
        end: position,
      });
      continue;
    }

    // Handle strings (single quotes)
    if (char === "'") {
      let string = "'";
      position++;
      while (position < length && formula[position] !== "'") {
        if (formula[position] === "\\" && position + 1 < length) {
          string += formula[position] + formula[position + 1];
          position += 2;
        } else {
          string += formula[position];
          position++;
        }
      }
      if (position < length) {
        string += "'";
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.STRING,
        value: string,
        start: position - string.length,
        end: position,
      });
      continue;
    }

    // Handle comments (/* */)
    if (
      char === "/" &&
      position + 1 < length &&
      formula[position + 1] === "*"
    ) {
      let comment = "/*";
      position += 2;
      while (
        position < length &&
        !(
          formula[position] === "*" &&
          position + 1 < length &&
          formula[position + 1] === "/"
        )
      ) {
        comment += formula[position];
        position++;
      }
      if (position < length) {
        comment += "*/";
        position += 2;
      }
      tokens.push({
        type: TOKEN_TYPES.COMMENT,
        value: comment,
        start: position - comment.length,
        end: position,
      });
      continue;
    }

    // Handle comments (//)
    if (
      char === "/" &&
      position + 1 < length &&
      formula[position + 1] === "/"
    ) {
      let comment = "//";
      position += 2;
      while (
        position < length &&
        formula[position] !== "\n" &&
        formula[position] !== "\r"
      ) {
        comment += formula[position];
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.COMMENT,
        value: comment,
        start: position - comment.length,
        end: position,
      });
      continue;
    }

    // Handle operators (multi-character) - MUST come before other character handling
    let operatorFound = false;
    for (const op of OPERATORS) {
      if (
        position + op.length <= length &&
        formula.substring(position, position + op.length) === op
      ) {
        tokens.push({
          type: TOKEN_TYPES.OPERATOR,
          value: op,
          start: position,
          end: position + op.length,
        });
        position += op.length;
        operatorFound = true;
        break;
      }
    }
    if (operatorFound) continue;

    // Handle field references (square brackets) - including nested fields
    if (char === "[") {
      // Check if this is part of a nested field reference pattern
      let isNestedPattern = false;
      let fullNestedField = "";
      let originalPosition = position;

      // Look ahead to see if this is followed by a dot and another field
      let tempPosition = position;
      let bracketCount = 0;

      // Extract the first field
      let firstField = "";
      while (tempPosition < length && bracketCount >= 0) {
        const currentChar = formula[tempPosition];
        if (currentChar === "[") {
          bracketCount++;
        } else if (currentChar === "]") {
          bracketCount--;
        }
        firstField += currentChar;
        tempPosition++;
        if (bracketCount === 0) break;
      }

      // Start building the full nested field expression
      fullNestedField = firstField;

      // Continue looking for more dot.field patterns
      while (tempPosition < length) {
        // Skip whitespace
        while (tempPosition < length && /\s/.test(formula[tempPosition])) {
          tempPosition++;
        }

        // Check for dot
        if (tempPosition < length && formula[tempPosition] === ".") {
          tempPosition++; // Skip the dot

          // Skip whitespace after dot
          while (tempPosition < length && /\s/.test(formula[tempPosition])) {
            tempPosition++;
          }

          // Check for next field reference
          if (tempPosition < length && formula[tempPosition] === "[") {
            isNestedPattern = true;

            // Extract the next field
            let nextField = "";
            bracketCount = 0;
            while (tempPosition < length && bracketCount >= 0) {
              const currentChar = formula[tempPosition];
              if (currentChar === "[") {
                bracketCount++;
              } else if (currentChar === "]") {
                bracketCount--;
              }
              nextField += currentChar;
              tempPosition++;
              if (bracketCount === 0) break;
            }

            // Add to the full nested field expression
            fullNestedField += "." + nextField;
          } else {
            // No more field after dot, break the loop
            break;
          }
        } else {
          // No dot found, break the loop
          break;
        }
      }

      if (isNestedPattern) {
        // Create a single nested field token
        tokens.push({
          type: TOKEN_TYPES.NESTED_FIELD,
          value: fullNestedField,
          start: originalPosition,
          end: tempPosition,
        });
        position = tempPosition;
        continue;
      } else {
        // Handle as a regular field reference
        let field = "[";
        position++;
        bracketCount = 1;

        while (position < length && bracketCount > 0) {
          const currentChar = formula[position];

          if (currentChar === "[") {
            bracketCount++;
          } else if (currentChar === "]") {
            bracketCount--;
          }

          field += currentChar;
          position++;
        }

        // Check if this field contains a dot (like [Account.Name])
        const isNested = field.includes(".");
        const fieldType =
          isNested ? TOKEN_TYPES.NESTED_FIELD : TOKEN_TYPES.FIELD;

        tokens.push({
          type: fieldType,
          value: field,
          start: position - field.length,
          end: position,
        });
        continue;
      }
    }

    // Handle parentheses
    if (char === "(" || char === ")") {
      tokens.push({
        type: TOKEN_TYPES.PARENTHESIS,
        value: char,
        start: position,
        end: position + 1,
      });
      position++;
      continue;
    }

    // Handle commas
    if (char === ",") {
      tokens.push({
        type: TOKEN_TYPES.COMMA,
        value: char,
        start: position,
        end: position + 1,
      });
      position++;
      continue;
    }

    // Handle numbers
    if (/\d/.test(char)) {
      let number = "";
      while (
        position < length &&
        (/\d/.test(formula[position]) || formula[position] === ".")
      ) {
        number += formula[position];
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.NUMBER,
        value: number,
        start: position - number.length,
        end: position,
      });
      continue;
    }

    // Handle dot notation (for nested field references)
    // Only create dot tokens if they're not part of a nested field reference
    if (char === ".") {
      // Check if this dot is part of a nested field reference pattern
      let isPartOfNestedField = false;

      // Look back to see if we just had a field reference
      if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (
          lastToken.type === TOKEN_TYPES.FIELD ||
          lastToken.type === TOKEN_TYPES.NESTED_FIELD
        ) {
          // Look ahead to see if there's another field reference
          let tempPosition = position + 1;
          while (tempPosition < length && /\s/.test(formula[tempPosition])) {
            tempPosition++;
          }
          if (tempPosition < length && formula[tempPosition] === "[") {
            isPartOfNestedField = true;
          }
        }
      }

      if (!isPartOfNestedField) {
        tokens.push({
          type: TOKEN_TYPES.DOT,
          value: char,
          start: position,
          end: position + 1,
        });
      }
      position++;
      continue;
    }

    // Handle identifiers (functions, constants, etc.)
    if (/[a-zA-Z_]/.test(char)) {
      let identifier = "";
      while (position < length && /[a-zA-Z0-9_]/.test(formula[position])) {
        identifier += formula[position];
        position++;
      }
      tokens.push({
        type: TOKEN_TYPES.IDENTIFIER,
        value: identifier,
        start: position - identifier.length,
        end: position,
      });
      continue;
    }

    // Handle any other character as identifier
    tokens.push({
      type: TOKEN_TYPES.IDENTIFIER,
      value: char,
      start: position,
      end: position + 1,
    });
    position++;
  }

  return tokens;
}

/**
 * Classifies tokens into specific types (function, constant, etc.)
 * @param {Array} tokens - Array of tokens from tokenizeFormula
 * @returns {Array} Array of classified tokens
 */
function classifyTokens(tokens) {
  const allFunctions = [
    ...SF_KEYWORDS.logical,
    ...SF_KEYWORDS.text,
    ...SF_KEYWORDS.math,
    ...SF_KEYWORDS.datetime,
    ...SF_KEYWORDS.conversion,
    ...SF_KEYWORDS.advanced,
  ];

  return tokens.map((token, index) => {
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      const upperValue = token.value.toUpperCase();

      // Check if it's a function
      if (allFunctions.includes(upperValue)) {
        return { ...token, type: TOKEN_TYPES.FUNCTION, value: upperValue };
      }

      // Check if it's a constant
      if (SF_KEYWORDS.constants.includes(upperValue)) {
        return { ...token, type: TOKEN_TYPES.CONSTANT, value: upperValue };
      }

      // Check if it's a custom function (starts with lowercase and has parentheses after)
      if (/^[a-z]/.test(token.value)) {
        // Look ahead to see if there's a parenthesis after this identifier
        let hasParenthesis = false;
        for (let i = index + 1; i < tokens.length; i++) {
          if (tokens[i].type === TOKEN_TYPES.WHITESPACE) continue;
          if (
            tokens[i].type === TOKEN_TYPES.PARENTHESIS &&
            tokens[i].value === "("
          ) {
            hasParenthesis = true;
          }
          break;
        }
        if (hasParenthesis) {
          return { ...token, type: TOKEN_TYPES.CUSTOM_FUNCTION };
        }
      }

      // Check if it's a formula field reference (contains underscore and looks like a field name)
      if (
        token.value.includes("_") &&
        /^[A-Z][a-zA-Z0-9_]*$/.test(token.value)
      ) {
        return { ...token, type: TOKEN_TYPES.FORMULA_FIELD };
      }
    }

    return token;
  });
}

/**
 * Renders tokens as HTML with syntax highlighting
 * @param {Array} tokens - Array of classified tokens
 * @returns {string} HTML string with syntax highlighting
 */
function renderTokens(tokens) {
  return tokens
    .map((token) => {
      switch (token.type) {
        case TOKEN_TYPES.FUNCTION:
          return `<span class="sf-function">${token.value}</span>`;
        case TOKEN_TYPES.FIELD:
          return `<span class="sf-field">${token.value}</span>`;
        case TOKEN_TYPES.NESTED_FIELD:
          return `<span class="sf-nested-field">${token.value}</span>`;
        case TOKEN_TYPES.CUSTOM_FUNCTION:
          return `<span class="sf-custom-function">${token.value}</span>`;
        case TOKEN_TYPES.FORMULA_FIELD:
          return `<span class="sf-formula-field">${token.value}</span>`;
        case TOKEN_TYPES.OPERATOR:
          return `<span class="sf-operator">${token.value}</span>`;
        case TOKEN_TYPES.STRING:
          return `<span class="sf-string">${token.value}</span>`;
        case TOKEN_TYPES.NUMBER:
          return `<span class="sf-number">${token.value}</span>`;
        case TOKEN_TYPES.CONSTANT:
          return `<span class="sf-constant">${token.value}</span>`;
        case TOKEN_TYPES.COMMENT:
          return `<span class="sf-comment">${token.value}</span>`;
        case TOKEN_TYPES.ERROR:
          return `<span class="sf-error">${token.value}</span>`;
        case TOKEN_TYPES.DOT:
          return `<span class="sf-dot">${token.value}</span>`;
        case TOKEN_TYPES.PARENTHESIS:
          return `<span class="sf-parenthesis">${token.value}</span>`;
        case TOKEN_TYPES.COMMA:
          return `<span class="sf-comma">${token.value}</span>`;
        case TOKEN_TYPES.WHITESPACE:
          return token.value;
        default:
          return token.value;
      }
    })
    .join("");
}

/**
 * Main function to highlight a Salesforce formula
 * @param {string} formula - The Salesforce formula to highlight
 * @param {boolean} showErrors - Whether to highlight syntax errors (default: true)
 * @returns {string} HTML string with syntax highlighting
 */
function highlightFormula(formula, showErrors = true) {
  const tokens = tokenizeFormula(formula);
  let classifiedTokens = classifyTokens(tokens);

  if (showErrors) {
    const errors = detectFormulaErrors(formula);
    if (errors.length > 0) {
      classifiedTokens = markErrorTokens(classifiedTokens, errors);
    }
  }

  return renderTokens(classifiedTokens);
}

/**
 * Creates a syntax-highlighted code block for a Salesforce formula
 * @param {string} formula - The Salesforce formula
 * @param {Object} options - Display options
 * @param {boolean} options.prettify - Whether to prettify the formula first
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.showCopyButton - Whether to show a copy button
 * @returns {string} HTML for the code block
 */
function createFormulaCodeBlock(formula, options = {}) {
  const {
    prettify = true,
    className = "",
    showCopyButton = true,
    showLineNumbers = false,
    showThemeSelector = false,
    showCollapseToggle = false,
    maxLines = null,
  } = options;

  if (!formula || typeof formula !== "string") {
    return '<div class="ui grey label">No formula</div>';
  }

  const processedFormula =
    prettify ? prettifySalesforceFormula(formula) : formula;
  const highlightedFormula = highlightFormula(processedFormula);

  // Generate line numbers if requested
  let lineNumbersHtml = "";
  if (showLineNumbers) {
    const lines = processedFormula.split("\n");
    lineNumbersHtml =
      '<div class="line-numbers">' +
      lines.map((_, index) => `<div>${index + 1}</div>`).join("") +
      "</div>";
  }

  // Theme selector if requested
  let themeSelectorHtml = "";
  if (showThemeSelector) {
    const themes = getAvailableThemes();
    const currentTheme = getCurrentTheme();
    themeSelectorHtml = `
      <div class="theme-selector">
        <select class="ui mini dropdown" onchange="setFormulaTheme(this.value)">
          ${themes
            .map(
              (theme) =>
                `<option value="${theme}" ${theme === currentTheme ? "selected" : ""}>${theme.charAt(0).toUpperCase() + theme.slice(1)}</option>`
            )
            .join("")}
        </select>
      </div>
    `;
  }

  // Collapse toggle if requested
  let collapseToggleHtml = "";
  if (showCollapseToggle) {
    collapseToggleHtml = `
      <button class="ui mini icon button collapse-toggle" title="Toggle collapse" onclick="toggleFormulaCollapse(this)">
        <i class="chevron down icon"></i>
      </button>
    `;
  }

  // Apply max lines if specified
  let maxHeightStyle = "";
  if (maxLines) {
    const lineHeight = 1.4; // matches CSS line-height
    const fontSize = 13; // matches CSS font-size
    const maxHeight = maxLines * lineHeight * fontSize;
    maxHeightStyle = `max-height: ${maxHeight}px; overflow-y: auto;`;
  }

  const copyButton =
    showCopyButton ?
      '<button class="ui mini icon button copy-formula" style="position: absolute; top: 5px; right: 5px;" title="Copy formula"><i class="copy icon"></i></button>'
    : "";

  const uniqueId = "formula-" + Math.random().toString(36).substr(2, 9);
  const lineNumbersClass = showLineNumbers ? "with-line-numbers" : "";

  return `
    <div class="formula-container ${className}" style="position: relative;">
      ${copyButton}
      ${themeSelectorHtml}
      ${collapseToggleHtml}
      <pre class="sf-formula-code ${lineNumbersClass}" data-formula="${processedFormula.replace(/"/g, "&quot;")}" id="${uniqueId}" style="${maxHeightStyle}">${lineNumbersHtml}${highlightedFormula}</pre>
    </div>
  `;
}

/**
 * Renders a Salesforce formula for DataTable display
 * @param {boolean} prettify - Whether to prettify the formula
 * @param {boolean} showCopyButton - Whether to show copy button in table cells
 * @returns {Function} - DataTable render function
 */
function renderSalesforceFormula(prettify = true, showCopyButton = false) {
  return function (data, type) {
    if (type === "display") {
      if (!data || typeof data !== "string") {
        return '<div class="ui grey label">No formula</div>';
      }

      const processedFormula =
        prettify ? prettifySalesforceFormula(data) : data;
      const highlightedFormula = highlightFormula(processedFormula);

      if (showCopyButton) {
        const uniqueId = "formula-" + Math.random().toString(36).substr(2, 9);
        return `
          <div class="formula-container" style="position: relative;">
            <button class="ui mini icon button copy-formula" style="position: absolute; top: 2px; right: 2px;" title="Copy formula"><i class="copy icon"></i></button>
            <pre class="sf-formula-code" data-formula="${processedFormula.replace(/"/g, "&quot;")}" id="${uniqueId}" style="margin: 0; padding: 8px; font-size: 0.9em;">${highlightedFormula}</pre>
          </div>
        `;
      } else {
        return `<pre class="sf-formula-code" style="margin: 0; padding: 8px; font-size: 0.9em;">${highlightedFormula}</pre>`;
      }
    } else {
      return data;
    }
  };
}

/**
 * Initializes copy functionality for formula code blocks
 * @param {string} selector - CSS selector for formula containers
 */
function initializeFormulaCopyButtons(selector = ".formula-container") {
  $(document).on("click", `${selector} .copy-formula`, function (e) {
    e.preventDefault();
    e.stopPropagation();

    const $container = $(this).closest(".formula-container");
    const $pre = $container.find(".sf-formula-code");
    const formula = $pre.attr("data-formula") || $pre.text();

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(formula)
        .then(() => {
          // Show success feedback
          const $button = $(this);
          const originalIcon = $button.html();
          $button.html('<i class="check icon"></i>').addClass("positive");
          setTimeout(() => {
            $button.html(originalIcon).removeClass("positive");
          }, 1000);
        })
        .catch((err) => {
          console.error("Failed to copy formula:", err);
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = formula;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  });
}

/**
 * Theme definitions for Salesforce formula syntax highlighting
 */
const FORMULA_THEMES = {
  light: {
    background: "#f8f9fa",
    border: "#e9ecef",
    function: "#0066cc",
    constant: "#cc6600",
    operator: "#666666",
    field: "#009900",
    nestedField: "#006633",
    customFunction: "#9933cc",
    formulaField: "#cc6600",
    formulaFieldBg: "#fff3cd",
    string: "#cc0066",
    number: "#0066cc",
    comment: "#999999",
    error: "#dc3545",
    errorBg: "#f8d7da",
    dot: "#666666",
    parenthesis: "#666666",
    comma: "#666666",
    lineNumbers: "#999999",
    lineNumbersBg: "#f1f3f4",
  },
  dark: {
    background: "#2d3748",
    border: "#4a5568",
    function: "#63b3ed",
    constant: "#f6ad55",
    operator: "#e2e8f0",
    field: "#68d391",
    nestedField: "#7dd3fc",
    customFunction: "#d53f8c",
    formulaField: "#f6ad55",
    formulaFieldBg: "#744210",
    string: "#f687b3",
    number: "#63b3ed",
    comment: "#718096",
    error: "#fc8181",
    errorBg: "#742a2a",
    dot: "#e2e8f0",
    parenthesis: "#e2e8f0",
    comma: "#e2e8f0",
    lineNumbers: "#718096",
    lineNumbersBg: "#1a202c",
  },
  solarized: {
    background: "#fdf6e3",
    border: "#93a1a1",
    function: "#268bd2",
    constant: "#cb4b16",
    operator: "#586e75",
    field: "#859900",
    nestedField: "#2aa198",
    customFunction: "#d33682",
    formulaField: "#cb4b16",
    formulaFieldBg: "#fdf6e3",
    string: "#d33682",
    number: "#268bd2",
    comment: "#93a1a1",
    error: "#dc322f",
    errorBg: "#fdf6e3",
    dot: "#586e75",
    parenthesis: "#586e75",
    comma: "#586e75",
    lineNumbers: "#93a1a1",
    lineNumbersBg: "#eee8d5",
  },
  monokai: {
    background: "#272822",
    border: "#3e3d32",
    function: "#a6e22e",
    constant: "#fd971f",
    operator: "#ffffff",
    field: "#a6e22e",
    nestedField: "#93c5fd",
    customFunction: "#f92672",
    formulaField: "#fd971f",
    formulaFieldBg: "#3e3d32",
    string: "#e6db74",
    number: "#ae81ff",
    comment: "#75715e",
    error: "#f92672",
    errorBg: "#3e3d32",
    dot: "#ffffff",
    parenthesis: "#ffffff",
    comma: "#ffffff",
    lineNumbers: "#75715e",
    lineNumbersBg: "#1d1e19",
  },
};

/**
 * Current theme for formula highlighting
 */
let currentTheme = "light";

/**
 * Sets the theme for Salesforce formula syntax highlighting
 * @param {string} themeName - Name of the theme to apply
 */
function setFormulaTheme(themeName) {
  if (!FORMULA_THEMES[themeName]) {
    console.warn(
      `Theme "${themeName}" not found. Available themes:`,
      Object.keys(FORMULA_THEMES)
    );
    return;
  }

  currentTheme = themeName;
  updateFormulaStyles();
}

/**
 * Gets the current theme
 * @returns {string} Current theme name
 */
function getCurrentTheme() {
  return currentTheme;
}

/**
 * Gets available themes
 * @returns {Array} Array of available theme names
 */
function getAvailableThemes() {
  return Object.keys(FORMULA_THEMES);
}

/**
 * Updates formula styles based on current theme
 */
function updateFormulaStyles() {
  const theme = FORMULA_THEMES[currentTheme];
  const styleElement = document.getElementById("sf-formula-styles");

  if (!styleElement) {
    addFormulaSyntaxStyles();
    return;
  }

  // Update CSS custom properties
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, value]) => {
    // Convert camelCase to kebab-case for CSS custom properties
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--sf-${cssKey}`, value);
  });
}

/**
 * Adds CSS styles for Salesforce formula syntax highlighting
 * This should be called once when the page loads
 */
function addFormulaSyntaxStyles() {
  if (document.getElementById("sf-formula-styles")) {
    return; // Styles already added
  }

  const styles = `
    <style id="sf-formula-styles">
      :root {
        --sf-background: #f8f9fa;
        --sf-border: #e9ecef;
        --sf-function: #0066cc;
        --sf-constant: #cc6600;
        --sf-operator: #666666;
        --sf-field: #009900;
        --sf-nested-field: #006633;
        --sf-custom-function: #9933cc;
        --sf-formula-field: #cc6600;
        --sf-formula-field-bg: #fff3cd;
        --sf-string: #cc0066;
        --sf-number: #0066cc;
        --sf-comment: #999999;
        --sf-error: #dc3545;
        --sf-error-bg: #f8d7da;
        --sf-dot: #666666;
        --sf-parenthesis: #666666;
        --sf-comma: #666666;
        --sf-line-numbers: #999999;
        --sf-line-numbers-bg: #f1f3f4;
      }

      .sf-formula-code {
        background-color: var(--sf-background);
        border: 1px solid var(--sf-border);
        border-radius: 4px;
        padding: 12px;
        margin: 8px 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        line-height: 1.4;
        overflow-x: auto;
        white-space: pre-wrap;
        word-wrap: break-word;
        position: relative;
      }

      .sf-formula-code.with-line-numbers {
        padding-left: 3.5em;
      }

      .sf-formula-code .line-numbers {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3em;
        background-color: var(--sf-line-numbers-bg);
        border-right: 1px solid var(--sf-border);
        padding: 12px 8px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--sf-line-numbers);
        text-align: right;
        user-select: none;
        overflow: hidden;
      }

      .sf-formula-code .sf-function {
        color: var(--sf-function);
        font-weight: bold;
      }

      .sf-formula-code .sf-constant {
        color: var(--sf-constant);
        font-weight: bold;
      }

      .sf-formula-code .sf-operator {
        color: var(--sf-operator);
        font-weight: bold;
      }

      .sf-formula-code .sf-field {
        color: var(--sf-field);
        font-weight: bold;
      }

      .sf-formula-code .sf-string {
        color: var(--sf-string);
      }

      .sf-formula-code .sf-number {
        color: var(--sf-number);
        font-weight: bold;
      }

      .sf-formula-code .sf-comment {
        color: var(--sf-comment);
        font-style: italic;
      }

      .sf-formula-code .sf-nested-field {
        color: var(--sf-nested-field);
        font-weight: bold;
        text-decoration: underline;
      }

      .sf-formula-code .sf-custom-function {
        color: var(--sf-custom-function);
        font-weight: bold;
        font-style: italic;
      }

      .sf-formula-code .sf-formula-field {
        color: var(--sf-formula-field);
        font-weight: bold;
        background-color: var(--sf-formula-field-bg);
        padding: 1px 3px;
        border-radius: 2px;
      }

      .sf-formula-code .sf-error {
        color: var(--sf-error);
        font-weight: bold;
        background-color: var(--sf-error-bg);
        padding: 1px 3px;
        border-radius: 2px;
        text-decoration: line-through;
      }

      .sf-formula-code .sf-dot {
        color: var(--sf-dot);
        font-weight: bold;
      }

      .sf-formula-code .sf-parenthesis {
        color: var(--sf-parenthesis);
        font-weight: bold;
      }

      .sf-formula-code .sf-comma {
        color: var(--sf-comma);
        font-weight: bold;
      }

      .formula-container {
        position: relative;
      }

      .formula-container .copy-formula {
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .formula-container:hover .copy-formula {
        opacity: 1;
      }

      .formula-container .copy-formula.positive {
        background-color: #21ba45 !important;
        color: white !important;
      }

      .formula-container .theme-selector {
        position: absolute;
        top: 8px;
        right: 40px;
        z-index: 10;
      }

      .formula-container .collapse-toggle {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .formula-container:hover .collapse-toggle {
        opacity: 1;
      }

      .formula-container.collapsed .sf-formula-code {
        max-height: 60px;
        overflow: hidden;
        position: relative;
      }

      .formula-container.collapsed .sf-formula-code::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 20px;
        background: linear-gradient(transparent, var(--sf-background));
        pointer-events: none;
      }
    </style>
  `;

  document.head.insertAdjacentHTML("beforeend", styles);

  // Initialize with current theme
  updateFormulaStyles();
}

/**
 * Toggles the collapse state of a formula container
 * @param {HTMLElement} button - The collapse toggle button
 */
function toggleFormulaCollapse(button) {
  const container = button.closest(".formula-container");
  const icon = button.querySelector("i");

  if (container.classList.contains("collapsed")) {
    // Expand
    container.classList.remove("collapsed");
    icon.className = "chevron down icon";
    button.title = "Collapse";
  } else {
    // Collapse
    container.classList.add("collapsed");
    icon.className = "chevron up icon";
    button.title = "Expand";
  }
}

/**
 * Initializes all Salesforce formula functionality
 * Call this once when the page loads
 */
function initializeSalesforceFormulaSupport() {
  addFormulaSyntaxStyles();
  initializeFormulaCopyButtons();

  // Initialize theme selector dropdowns
  $(document).on("change", ".theme-selector select", function () {
    setFormulaTheme(this.value);
  });
}

/**
 * Detects syntax errors and invalid functions in a Salesforce formula
 * @param {string} formula - The Salesforce formula to validate
 * @returns {Array} Array of error objects with position and message
 */
function detectFormulaErrors(formula) {
  const errors = [];

  if (!formula || typeof formula !== "string") {
    return errors;
  }

  const tokens = tokenizeFormula(formula);
  const allFunctions = [
    ...SF_KEYWORDS.logical,
    ...SF_KEYWORDS.text,
    ...SF_KEYWORDS.math,
    ...SF_KEYWORDS.datetime,
    ...SF_KEYWORDS.conversion,
    ...SF_KEYWORDS.advanced,
  ];

  // Check for unmatched parentheses
  let openParens = 0;
  let openBrackets = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === TOKEN_TYPES.PARENTHESIS) {
      if (token.value === "(") {
        openParens++;
      } else if (token.value === ")") {
        openParens--;
        if (openParens < 0) {
          errors.push({
            position: token.start,
            message: "Unmatched closing parenthesis",
            type: "syntax",
          });
        }
      }
    }

    if (token.type === TOKEN_TYPES.BRACKET) {
      if (token.value === "[") {
        openBrackets++;
      } else if (token.value === "]") {
        openBrackets--;
        if (openBrackets < 0) {
          errors.push({
            position: token.start,
            message: "Unmatched closing bracket",
            type: "syntax",
          });
        }
      }
    }

    // Check for invalid functions (identifiers that look like functions but aren't)
    if (token.type === TOKEN_TYPES.IDENTIFIER) {
      const upperValue = token.value.toUpperCase();

      // Look ahead to see if this identifier is followed by a parenthesis
      let isFunctionCall = false;
      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === TOKEN_TYPES.WHITESPACE) continue;
        if (
          tokens[j].type === TOKEN_TYPES.PARENTHESIS &&
          tokens[j].value === "("
        ) {
          isFunctionCall = true;
        }
        break;
      }

      if (
        isFunctionCall &&
        !allFunctions.includes(upperValue) &&
        /^[A-Z]/.test(token.value)
      ) {
        errors.push({
          position: token.start,
          message: `Invalid function: ${token.value}`,
          type: "function",
        });
      }
    }
  }

  // Check for unmatched opening parentheses/brackets
  if (openParens > 0) {
    errors.push({
      position: formula.length - 1,
      message: `${openParens} unmatched opening parenthesis${openParens > 1 ? "es" : ""}`,
      type: "syntax",
    });
  }

  if (openBrackets > 0) {
    errors.push({
      position: formula.length - 1,
      message: `${openBrackets} unmatched opening bracket${openBrackets > 1 ? "s" : ""}`,
      type: "syntax",
    });
  }

  return errors;
}

/**
 * Highlights errors in a formula by marking error tokens
 * @param {Array} tokens - Array of tokens from tokenizeFormula
 * @param {Array} errors - Array of error objects from detectFormulaErrors
 * @returns {Array} Array of tokens with error tokens marked
 */
function markErrorTokens(tokens, errors) {
  const errorPositions = new Set();

  // Mark positions that have errors
  errors.forEach((error) => {
    errorPositions.add(error.position);
  });

  return tokens.map((token) => {
    if (errorPositions.has(token.start) || errorPositions.has(token.end - 1)) {
      return { ...token, type: TOKEN_TYPES.ERROR };
    }
    return token;
  });
}

// Auto-initialize when the script loads
if (typeof document !== "undefined") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeSalesforceFormulaSupport
  );
}
