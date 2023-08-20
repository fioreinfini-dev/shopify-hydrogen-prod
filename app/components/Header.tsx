import React, { useState, useRef, useEffect } from 'react';
import { Await, NavLink, useMatches } from '@remix-run/react';
import { Suspense } from 'react';
import type { LayoutProps } from './Layout';
import {
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu"
import { Icon } from '@iconify/react';
import { SearchAside, MobileMenuAside, CartAside } from '~/components/Layout'
import { Button, buttonVariants } from './ui/button';

type HeaderProps = Pick<LayoutProps, 'header' | 'cart' | 'isLoggedIn'>;

type Viewport = 'desktop' | 'mobile';

export function Header({ header, isLoggedIn, cart }: HeaderProps) {
  const { shop, menu } = header;
  return (
    <header className="z-[1] border-b">
      <div className="container flex items-center gap-2 px-4 py-2 mx-auto">
        <HeaderMenuMobileToggle header={header} />
        <NavLink prefetch="intent" to="/" end>
          <strong>{shop.name}</strong>
        </NavLink>
        <HeaderMenu menu={menu} viewport="desktop" />
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} header={header} />
      </div>
    </header>
  );
}

type HeaderMenuProps = {
  menu: any;  // Replace 'any' with the actual type
  viewport: string;
  onNavLinkClick?: () => void;
};

export function HeaderMenu({ menu, viewport, onNavLinkClick }: HeaderMenuProps) {
  
  const [hoveredItems, setHoveredItems] = useState<Set<string>>(new Set());
  const timeoutRef = useRef<number | null>(null);
  const [hoveredParent, setHoveredParent] = useState<string | null>(null);
  useEffect(() => {
    console.log('Hovered Items:', Array.from(hoveredItems));
    console.log('Hovered Parent:', hoveredParent);
  }, [hoveredItems, hoveredParent]);


  const handleMouseOver = (id: string, level: number) => {
    console.log(`Mouse over item with id ${id} at level ${level}`);
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
  
    if (level === 0) {
      // For 1st level parent, open its immediate children
      setHoveredItems(new Set(menu.items.find((item: any) => item.id === id)?.items.map((child: any) => child.id) || []));
      setHoveredParent(id);
    } else if (level === 1) {
      // For 2nd level parent, open its immediate children
      const parentItem = menu.items.find((item: any) => item.items.find((child: any) => child.id === id));
      setHoveredItems(new Set(parentItem?.items.map((child: any) => child.id) || []));
      setHoveredParent(id);
    } else {
      // For 3rd level or deeper, only open its own children
      setHoveredItems(new Set([id, ...menu.items.find((item: any) => item.items.find((child: any) => child.id === id))?.items.map((child: any) => child.id) || []]));
    }
  };
  
  

  const handleMouseLeave = (id: string) => {
    console.log(`Mouse left item with id ${id}`);
    timeoutRef.current = setTimeout(() => {
      setHoveredItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      if (hoveredParent === id) {
        setHoveredParent(null);
      }
    }, 200); // Delay the closing of the submenu by 200ms
  };  
  

  const renderMenuItem = (item: any, level: number = 0) => {
    console.log(`Rendering menu item with id ${item.id} at level ${level}`);
    if (!item.url) return null;

    return (
      <div
        className="relative group"
        key={item.id}
        onMouseOver={() => handleMouseOver(item.id, level)}
        onMouseLeave={() => handleMouseLeave(item.id)}
      >
        <NavLink
          className={({ isActive, isPending }) => `
            ${navigationMenuTriggerStyle()}
            ${viewport === 'mobile' && '!w-full !justify-start'}
            ${isActive && '!bg-accent'}
            ${isPending && 'animate-pulse'}
          `}
          end
          onClick={onNavLinkClick}
          key={item.id}
          prefetch="intent"
          to={item.url}
        >
          {item.title}
        </NavLink>
        {item.items && item.items.length > 0 && (hoveredItems.has(item.id) || hoveredParent === item.id) && (
          <div
            className={`absolute ${level === 0 ? 'left-0 mt-2' : 'top-0 left-full ml-2'} bg-white shadow-md z-10`}
            style={{ minWidth: '200px' }}
          >
            {item.items.map((subItem: any) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };




  return (
    <nav
      className={`gap-1 ${viewport === 'mobile' ? 'flex flex-col' : 'ml-3 hidden md:flex'}`}
      role="navigation"
    >
      {(menu || FALLBACK_HEADER_MENU).items.map((item: any) => renderMenuItem(item))}
    </nav>
  );
}


function HeaderCtas({
  isLoggedIn,
  cart,
}: Pick<HeaderProps, 'isLoggedIn' | 'cart' | 'header'>) {
  return (
    <nav className="flex items-center gap-1 ml-auto" role="navigation">
      <NavLink
        className={({ isActive, isPending }) => `
          ${buttonVariants({ variant: isActive ? 'secondary' : 'ghost', size: 'icon' })}
          ${isPending && 'animate-pulse'}
        `}
        prefetch="intent"
        to="/account"
      >
        <Icon
          icon={isLoggedIn ? 'lucide:user-check' : 'lucide:user'}
          className="w-4 h-4"
        />
      </NavLink>
      <SearchToggle />
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle({
  header,
}: Pick<HeaderProps, 'header'>) {
  const { menu } = header;
  return (
    <MobileMenuAside menu={menu}>
      <Button variant="ghost" className="md:hidden" size="icon">
        <Icon icon="lucide:align-justify" className="w-4 h-4" />
      </Button>
    </MobileMenuAside>
  );
}

function SearchToggle() {
  return (
    <SearchAside>
      <Button variant="ghost" size="icon" title="Search">
        <Icon icon="lucide:search" className="w-4 h-4" />
      </Button>
    </SearchAside>
  );
}

type CartBadgeProps = {
  count: number;
  cart?: HeaderProps['cart'];
}
function CartBadge({ count, cart }: CartBadgeProps) {
  return (
    <CartAside cart={cart}>
      <Button variant="outline">
        <Icon icon="lucide:shopping-cart" className="w-4 h-4 mr-2" />
        {count}
      </Button>
    </CartAside>
  )
}

function CartToggle({ cart }: Pick<HeaderProps, 'cart'>) {
  return (
    <Suspense fallback={<CartBadge count={0} cart={cart} />}>
      <Await resolve={cart}>
        {(cart) => {
          if (!cart) return <CartBadge count={0} />;
          return <CartBadge count={cart.totalQuantity || 0} cart={cart} />;
        }}
      </Await>
    </Suspense>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};
