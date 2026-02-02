/**
 * AI-Powered UI Generator
 * Generates complete UI layouts and components from natural language descriptions
 */

export interface UIGenerationRequest {
  description: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  styling: 'tailwind' | 'css' | 'styled-components' | 'emotion';
  complexity: 'simple' | 'moderate' | 'complex';
  responsive: boolean;
  darkMode: boolean;
  accessibility: boolean;
}

export interface GeneratedComponent {
  name: string;
  code: string;
  props: Record<string, any>;
  imports: string[];
  dependencies: string[];
}

export interface GeneratedLayout {
  components: GeneratedComponent[];
  structure: string;
  styles: string;
  metadata: {
    componentCount: number;
    linesOfCode: number;
    complexity: string;
  };
}

export class UIGenerator {
  private templates: Map<string, any>;
  private componentLibrary: Map<string, string>;

  constructor() {
    this.templates = new Map();
    this.componentLibrary = new Map();
    this.initializeTemplates();
  }

  /**
   * Initialize common UI patterns and templates
   */
  private initializeTemplates() {
    // Dashboard template
    this.templates.set('dashboard', {
      components: ['Header', 'Sidebar', 'StatCards', 'Charts', 'DataTable'],
      layout: 'grid',
      sections: ['header', 'navigation', 'main', 'widgets']
    });

    // Form template
    this.templates.set('form', {
      components: ['FormField', 'Button', 'ErrorMessage', 'Validation'],
      layout: 'stack',
      sections: ['fields', 'actions', 'feedback']
    });

    // Landing page template
    this.templates.set('landing', {
      components: ['Hero', 'Features', 'Testimonials', 'CTA', 'Footer'],
      layout: 'sections',
      sections: ['hero', 'features', 'social-proof', 'conversion']
    });
  }

  /**
   * Generate UI from natural language description
   */
  async generate(request: UIGenerationRequest): Promise<GeneratedLayout> {
    // Parse description to extract intent
    const intent = this.parseIntent(request.description);
    
    // Select appropriate template
    const template = this.selectTemplate(intent);
    
    // Generate components
    const components = await this.generateComponents(template, request);
    
    // Generate structure
    const structure = this.generateStructure(components, request.framework);
    
    // Generate styles
    const styles = this.generateStyles(components, request);
    
    // Calculate metadata
    const metadata = this.calculateMetadata(components);
    
    return {
      components,
      structure,
      styles,
      metadata
    };
  }

  /**
   * Parse user description to extract UI intent
   */
  private parseIntent(description: string): {
    type: string;
    features: string[];
    elements: string[];
  } {
    const lower = description.toLowerCase();
    
    // Detect UI type
    let type = 'custom';
    if (lower.includes('dashboard') || lower.includes('analytics')) type = 'dashboard';
    else if (lower.includes('form') || lower.includes('input')) type = 'form';
    else if (lower.includes('landing') || lower.includes('homepage')) type = 'landing';
    else if (lower.includes('settings') || lower.includes('profile')) type = 'settings';
    else if (lower.includes('admin') || lower.includes('management')) type = 'admin';
    
    // Extract features
    const features: string[] = [];
    if (lower.includes('search')) features.push('search');
    if (lower.includes('filter')) features.push('filter');
    if (lower.includes('sort')) features.push('sort');
    if (lower.includes('table') || lower.includes('list')) features.push('data-table');
    if (lower.includes('chart') || lower.includes('graph')) features.push('charts');
    if (lower.includes('modal') || lower.includes('dialog')) features.push('modal');
    if (lower.includes('tab')) features.push('tabs');
    if (lower.includes('dropdown')) features.push('dropdown');
    
    // Extract UI elements
    const elements: string[] = [];
    const elementPatterns = [
      'button', 'input', 'card', 'nav', 'sidebar', 'header', 'footer',
      'menu', 'form', 'field', 'checkbox', 'select', 'badge', 'alert'
    ];
    
    for (const pattern of elementPatterns) {
      if (lower.includes(pattern)) elements.push(pattern);
    }
    
    return { type, features, elements };
  }

  /**
   * Select appropriate template based on intent
   */
  private selectTemplate(intent: any): any {
    return this.templates.get(intent.type) || {
      components: intent.elements.map(e => this.elementToComponent(e)),
      layout: 'flex',
      sections: ['main']
    };
  }

  /**
   * Map element name to component name
   */
  private elementToComponent(element: string): string {
    const mapping: Record<string, string> = {
      'button': 'Button',
      'input': 'Input',
      'card': 'Card',
      'nav': 'Navigation',
      'sidebar': 'Sidebar',
      'header': 'Header',
      'footer': 'Footer',
      'menu': 'Menu',
      'form': 'Form',
      'field': 'FormField',
      'checkbox': 'Checkbox',
      'select': 'Select',
      'badge': 'Badge',
      'alert': 'Alert'
    };
    
    return mapping[element] || element.charAt(0).toUpperCase() + element.slice(1);
  }

  /**
   * Generate component code
   */
  private async generateComponents(
    template: any,
    request: UIGenerationRequest
  ): Promise<GeneratedComponent[]> {
    const components: GeneratedComponent[] = [];
    
    for (const componentName of template.components) {
      const component = this.generateComponent(componentName, request);
      components.push(component);
    }
    
    return components;
  }

  /**
   * Generate single component
   */
  private generateComponent(
    name: string,
    request: UIGenerationRequest
  ): GeneratedComponent {
    const { framework, styling, darkMode, accessibility } = request;
    
    let code = '';
    let imports: string[] = [];
    let dependencies: string[] = [];
    
    if (framework === 'react') {
      code = this.generateReactComponent(name, styling, darkMode, accessibility);
      imports = ['React'];
      if (styling === 'tailwind') imports.push('cn from @/lib/utils');
    }
    
    return {
      name,
      code,
      props: this.inferProps(name),
      imports,
      dependencies
    };
  }

  /**
   * Generate React component code
   */
  private generateReactComponent(
    name: string,
    styling: string,
    darkMode: boolean,
    accessibility: boolean
  ): string {
    const props = this.inferProps(name);
    const propsType = Object.keys(props).map(k => `${k}?: ${typeof props[k]}`).join('; ');
    
    let styles = '';
    if (styling === 'tailwind') {
      styles = this.generateTailwindClasses(name, darkMode);
    }
    
    const a11y = accessibility ? this.generateA11yAttributes(name) : '';
    
    return `import React from 'react';
${styling === 'tailwind' ? "import { cn } from '@/lib/utils';" : ''}

interface ${name}Props {
  ${propsType}
  className?: string;
  children?: React.ReactNode;
}

export default function ${name}({ 
  ${Object.keys(props).join(', ')},
  className,
  children 
}: ${name}Props) {
  return (
    <div className={cn("${styles}", className)} ${a11y}>
      {children}
    </div>
  );
}
`;
  }

  /**
   * Generate Tailwind CSS classes
   */
  private generateTailwindClasses(componentName: string, darkMode: boolean): string {
    const base: Record<string, string> = {
      'Button': 'px-4 py-2 rounded-lg font-medium transition-colors',
      'Input': 'px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
      'Card': 'p-6 rounded-xl border shadow-sm',
      'Header': 'sticky top-0 z-50 border-b backdrop-blur-sm',
      'Sidebar': 'w-64 border-r flex flex-col',
      'Navigation': 'flex items-center gap-4',
      'FormField': 'space-y-2',
      'Select': 'px-3 py-2 border rounded-lg bg-white',
      'Checkbox': 'w-4 h-4 rounded border-gray-300',
      'Badge': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      'Alert': 'p-4 rounded-lg border'
    };
    
    let classes = base[componentName] || 'p-4';
    
    if (darkMode) {
      const darkModeClasses: Record<string, string> = {
        'Button': ' dark:bg-gray-800 dark:text-white',
        'Input': ' dark:bg-gray-900 dark:border-gray-700',
        'Card': ' dark:bg-gray-900 dark:border-gray-800',
        'Header': ' dark:bg-gray-900/80 dark:border-gray-800',
        'Sidebar': ' dark:bg-gray-900 dark:border-gray-800'
      };
      
      classes += darkModeClasses[componentName] || ' dark:bg-gray-900 dark:text-white';
    }
    
    return classes;
  }

  /**
   * Generate accessibility attributes
   */
  private generateA11yAttributes(componentName: string): string {
    const attributes: Record<string, string> = {
      'Button': 'role="button" tabIndex={0}',
      'Input': 'aria-label="Input field"',
      'Navigation': 'role="navigation" aria-label="Main navigation"',
      'Header': 'role="banner"',
      'Footer': 'role="contentinfo"',
      'Alert': 'role="alert" aria-live="polite"'
    };
    
    return attributes[componentName] || '';
  }

  /**
   * Infer component props based on name
   */
  private inferProps(componentName: string): Record<string, any> {
    const propMap: Record<string, Record<string, any>> = {
      'Button': { variant: 'primary', size: 'md', disabled: false, onClick: null },
      'Input': { type: 'text', placeholder: '', value: '', onChange: null },
      'Card': { title: '', description: '' },
      'Badge': { variant: 'default', text: '' },
      'Alert': { type: 'info', message: '', dismissible: false }
    };
    
    return propMap[componentName] || {};
  }

  /**
   * Generate component structure
   */
  private generateStructure(
    components: GeneratedComponent[],
    framework: string
  ): string {
    const imports = components.map(c => 
      `import ${c.name} from './${c.name}';`
    ).join('\n');
    
    const componentTree = components.map(c => `  <${c.name} />`).join('\n');
    
    return `${imports}

export default function GeneratedLayout() {
  return (
    <div className="min-h-screen">
${componentTree}
    </div>
  );
}
`;
  }

  /**
   * Generate styles
   */
  private generateStyles(
    components: GeneratedComponent[],
    request: UIGenerationRequest
  ): string {
    if (request.styling === 'tailwind') {
      return '// Using Tailwind CSS - no separate stylesheet needed';
    }
    
    return `/* Generated styles for ${components.length} components */
/* Add custom CSS here */
`;
  }

  /**
   * Calculate metadata
   */
  private calculateMetadata(components: GeneratedComponent[]): any {
    const totalLines = components.reduce((sum, c) => 
      sum + c.code.split('\n').length, 0
    );
    
    return {
      componentCount: components.length,
      linesOfCode: totalLines,
      complexity: totalLines < 200 ? 'simple' : totalLines < 500 ? 'moderate' : 'complex'
    };
  }

  /**
   * Export as files
   */
  async exportFiles(layout: GeneratedLayout): Promise<Map<string, string>> {
    const files = new Map<string, string>();
    
    // Add component files
    for (const component of layout.components) {
      files.set(`${component.name}.tsx`, component.code);
    }
    
    // Add main layout file
    files.set('GeneratedLayout.tsx', layout.structure);
    
    // Add styles if applicable
    if (layout.styles && !layout.styles.includes('Tailwind')) {
      files.set('styles.css', layout.styles);
    }
    
    return files;
  }
}

export default UIGenerator;
