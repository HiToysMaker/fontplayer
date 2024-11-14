const i18next = require('i18next')
import { dialogs } from '../dialogs'
import { panels } from '../panels'
import { menus } from '../menus'
import { welcome } from '../welcome'
import { programming } from '../programming'

i18next.init({
	lng: 'cn',
	resources: {
		cn: {
			translation: {
				menus: menus.cn,
				dialogs: dialogs.cn,
				panels: panels.cn,
				welcome: welcome.cn,
				programming: programming.cn,
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