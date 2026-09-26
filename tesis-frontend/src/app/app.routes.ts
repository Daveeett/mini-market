import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';
import { adminGuard } from './features/auth/guards/admin.guard';
import { LayoutShellComponent } from './shared/components/layout-shell/layout-shell.component';

export const routes: Routes = [
	{
		path: 'login',
		loadComponent: () =>
			import('./features/auth/pages/login.page').then((m) => m.LoginPage),
	},
	{
		path: 'estado-cuenta/:token',
		loadComponent: () =>
			import('./features/public-statement/pages/public-statement.page').then(
				(m) => m.PublicStatementPage,
			),
	},
	{
		path: '',
		canActivate: [authGuard],
		component: LayoutShellComponent,
		children: [
			{
				path: 'dashboard',
				loadComponent: () =>
					import('./features/dashboard/pages/dashboard.page').then(
						(m) => m.DashboardPage,
					),
			},
			{
				path: 'customers',
				canActivate: [adminGuard],
				loadComponent: () =>
					import('./features/customers/pages/customers.page').then(
						(m) => m.CustomersPage,
					),
			},
			{
				path: 'credits',
				loadComponent: () =>
					import('./features/credits/pages/credits.page').then((m) => m.CreditsPage),
			},
			{
				path: 'wallet',
				loadComponent: () =>
					import('./features/wallet/pages/wallet.page').then((m) => m.WalletPage),
			},
			{
				path: 'cash',
				loadComponent: () =>
					import('./features/cash/pages/cash.page').then((m) => m.CashPage),
			},
			{
				path: 'reports',
				canActivate: [adminGuard],
				loadComponent: () =>
					import('./features/reports/pages/reports.page').then((m) => m.ReportsPage),
			},
			{
				path: 'users',
				canActivate: [adminGuard],
				loadComponent: () =>
					import('./features/users/pages/users.page').then((m) => m.UsersPage),
			},
			{
				path: 'offers',
				canActivate: [adminGuard],
				loadComponent: () =>
					import('./features/offers/pages/offers.page').then((m) => m.OffersPage),
			},
			{ path: '', pathMatch: 'full', redirectTo: 'dashboard' },
		],
	},
	{ path: '**', redirectTo: 'login' },
];
