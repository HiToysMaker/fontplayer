const i18next = require('i18next')
import { dialogs } from '../dialogs'
import { panels } from '../panels'
import { menus } from '../menus'
import { welcome } from '../welcome'
import { programming } from '../programming'

i18next.init({
	lng: 'zh',
	resources: {
		zh: {
			translation: {
				menus: menus.zh,
				dialogs: dialogs.zh,
				panels: panels.zh,
				welcome: welcome.zh,
				programming: programming.zh,
			}
		},
		en: {
			translation: {
				menus: menus.en,
				dialogs: dialogs.en,
				panels: panels.en,
				welcome: welcome.en,
				programming: programming.en,
			}
		}
	}
})

export {
	i18next,
}