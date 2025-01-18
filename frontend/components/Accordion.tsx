import { Fragment } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/solid';
import Avatar from './Avatar';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  id?: number;
  name?: string;
  type?: 'character' | 'persona';
}

const Accordion = ({ title, children, id, name, type }: AccordionProps) => {
  return (
    <div className="w-full">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-sm font-medium text-left text-gray-200 bg-gray-800 rounded-lg hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
              <div className="flex items-center space-x-3">
                {/* Conditionally render the image if id, name, and type are provided */}
                {id && name && type && (
                  <Avatar id={id} name={name} type={type} size={36} />
                )}
                <h2>{title}</h2>
              </div>
              <ChevronUpIcon
                className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </Disclosure.Button>
            <Transition
              as={Fragment}
              enter="transition duration-200 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-150 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-400">
                {children}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  );
};

export default Accordion;
