import { Disposable } from '../../base/common/lifecycle.js';
import { CommandsRegistry } from '../../platform/commands/common/commands.js';
import { MenuId, MenuRegistry } from "../../platform/actions/common/actions.js";
import { localize } from "../../nls.js";
import { ILogService } from "../../platform/log/common/log.js";

export class SagemakerServerClient extends Disposable {
	constructor (
		@ILogService private logService: ILogService
	) {
		super();

		this.logService.debug('Initializing SagemakerServerClient...');
		this.registerSagemakerCommands();
	}

	static LOGOUT_COMMAND_ID = 'sagemaker.logout';
	static COOKIE_COMMAND_ID = 'sagemaker.parseCookies';

	private registerSagemakerCommands() {
		const authMode: string | undefined = this.getCookieValue('authMode');
		const expiryTime: string | undefined = this.getCookieValue('expiryTime');
		const studioUserProfileName: string | undefined = this.getCookieValue('studioUserProfileName')
		const ssoExpiryTimestamp: string | undefined = this.getCookieValue('ssoExpiryTimestamp')
		const redirectURL: string | undefined = this.getCookieValue('redirectURL')

		this.logService.debug('Registering sagemaker commands...');

		CommandsRegistry.registerCommand(SagemakerServerClient.COOKIE_COMMAND_ID, () => {
			return {
				authMode: authMode,
				expiryTime: expiryTime,
				ssoExpiryTimestamp: ssoExpiryTimestamp,
				studioUserProfileName: studioUserProfileName,
				redirectURL: redirectURL
			};
		});

		CommandsRegistry.registerCommand(SagemakerServerClient.LOGOUT_COMMAND_ID, () => {
			const currentUrl = new URL(window.location.href);
			const hostname = currentUrl.hostname;
			const pathComponents = currentUrl.pathname.split('/');
			const logoutUrl = `https://${hostname}/${pathComponents[1]}/${pathComponents[2]}/logout`;
			window.location.href = logoutUrl;
		});

		for (const menuId of [MenuId.CommandPalette, MenuId.MenubarHomeMenu]) {
			MenuRegistry.appendMenuItem(menuId, {
				command: {
					id: SagemakerServerClient.LOGOUT_COMMAND_ID,
					title: localize('logout', "{0}: Log out", 'Sagemaker'),
				},
			});
		}
	}

	private getCookieValue(name: string): string | undefined {
		const match = document.cookie.match('(^|[^;]+)\\s*' + name + '\\s*=\\s*([^;]+)'); // See https://stackoverflow.com/a/25490531
		return match ? match.pop() : undefined;
	}
}