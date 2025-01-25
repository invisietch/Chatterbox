import Link from 'next/link';
import { useRouter } from 'next/router';
import SettingsBox from './SettingsBox';

import {
  ChatAlt2Icon,
  TagIcon,
  UserGroupIcon,
  UserCircleIcon,
  LightBulbIcon,
  ArrowCircleUpIcon,
  AdjustmentsIcon,
} from '@heroicons/react/outline';

const Navbar = () => {
  const router = useRouter();

  return (
    <nav className="bg-dark1 h-16 flex items-center px-6 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-8">
          <div className="text-3xl font-bold text-white">
            <Link href="/">Chatterbox</Link>
          </div>
          <div className="flex space-x-4 text-grey-300 hover:text-grey-100">
            <Link
              key="/"
              href="/"
              className={`${router.pathname === '/' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <ChatAlt2Icon className="h-8 w-8" />
            </Link>
            <Link
              key="/tags"
              href="/tags"
              className={`${router.pathname === '/tags' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <TagIcon className="h-8 w-8" />
            </Link>
            <Link
              key="/characters"
              href="/characters"
              className={`${router.pathname === '/characters' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <UserGroupIcon className="h-8 w-8" />
            </Link>
            <Link
              key="/pesonas"
              href="/personas"
              className={`${router.pathname === '/personas' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <UserCircleIcon className="h-8 w-8" />
            </Link>
            <Link
              key="/prompts"
              href="/prompts"
              className={`${router.pathname === '/prompts' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <LightBulbIcon className="h-8 w-8" />
            </Link>
            <Link
              key="/import-export"
              href="/import-export"
              className={`${router.pathname === '/import-export' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <ArrowCircleUpIcon className="h-8 w-8" />
            </Link>
            <Link
              key="/llm"
              href="/llm"
              className={`${router.pathname === '/llm' ? 'text-grey-300' : 'text-brightYellow'}`}
            >
              <AdjustmentsIcon className="h-8 w-8" />
            </Link>
          </div>
        </div>

        <div>
          <SettingsBox />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
