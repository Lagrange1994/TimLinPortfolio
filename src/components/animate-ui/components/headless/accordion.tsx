import * as React from 'react';

import {
  Disclosure as DisclosurePrimitive,
  DisclosureButton as DisclosureButtonPrimitive,
  DisclosurePanel as DisclosurePanelPrimitive,
  type DisclosureProps as DisclosurePrimitiveProps,
  type DisclosureButtonProps as DisclosureButtonPrimitiveProps,
  type DisclosurePanelProps as DisclosurePanelPrimitiveProps,
} from '@/components/animate-ui/primitives/headless/disclosure';
import { cn } from '@/lib/utils';

type AccordionProps<TTag extends React.ElementType = 'div'> =
  React.ComponentProps<TTag> & {
    children: React.ReactNode;
    as?: TTag;
  };

function Accordion<TTag extends React.ElementType = 'div'>({
  as: Component = 'div',
  ...props
}: AccordionProps<TTag>) {
  return <Component data-slot="accordion" {...props} />;
}

type AccordionItemProps<TTag extends React.ElementType = 'div'> =
  DisclosurePrimitiveProps<TTag>;

function AccordionItem<TTag extends React.ElementType = 'div'>({
  className,
  children,
  ...props
}: AccordionItemProps<TTag>) {
  return (
    <DisclosurePrimitive {...props}>
      {(bag) => (
        <div className={cn(className)}>
          {typeof children === 'function' ? children(bag) : children}
        </div>
      )}
    </DisclosurePrimitive>
  );
}

type AccordionButtonProps = DisclosureButtonPrimitiveProps & {
  showArrow?: boolean;
};

function AccordionButton({
  className,
  children,
  showArrow = true,
  ...props
}: AccordionButtonProps) {
  return (
    <DisclosureButtonPrimitive className={cn('faq-question', className)} {...props}>
      {(bag) => (
        <>
          {typeof children === 'function' ? children(bag) : children}
          {showArrow && (
            <i className="ph ph-caret-down faq-toggle-icon" aria-hidden="true" />
          )}
        </>
      )}
    </DisclosureButtonPrimitive>
  );
}

type AccordionPanelProps<TTag extends React.ElementType = 'div'> =
  DisclosurePanelPrimitiveProps<TTag>;

function AccordionPanel<TTag extends React.ElementType = 'div'>({
  className,
  children,
  ...props
}: AccordionPanelProps<TTag>) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <DisclosurePanelPrimitive<any> {...props}>
      {(bag) => (
        <div className={cn('faq-answer-inner', className)}>
          {typeof children === 'function' ? children(bag) : children}
        </div>
      )}
    </DisclosurePanelPrimitive>
  );
}

export {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionButtonProps,
  type AccordionPanelProps,
};
