import { cmfConnect } from '@talend/react-cmf';

import Container, { DEFAULT_STATE } from './Form.container';

export default cmfConnect({
	defaultState: DEFAULT_STATE,
	componentId(props) {
		return props.formId;
	},
})(Container);
