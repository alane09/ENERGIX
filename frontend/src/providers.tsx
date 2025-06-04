'use client';

import { DataProvider } from '@/context/data-context';
import { LayoutProvider } from '@/context/layout-context';
import { NotificationProvider } from '@/context/notification/notification-context';
import { ThemeProvider } from 'next-themes';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <DataProvider>
                <LayoutProvider>
                    <NotificationProvider>
                        {children}
                    </NotificationProvider>
                </LayoutProvider>
            </DataProvider>
        </ThemeProvider>
    );
}
