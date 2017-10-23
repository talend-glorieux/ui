import PropTypes from 'prop-types';
import React from 'react';
import { Layout } from '@talend/react-components';
import { Inject } from '@talend/react-cmf';

function getContent(component, props) {
	if (React.isValidElement(props)) {
		return props;
	}
	return (<Inject component={component} {...props} />);
}

function wrapChildren(children) {
	if (children && children.props && children.props.children) {
		return [children, ...wrapChildren(children.props.children)];
	} else if (children && !children.props) {
		// this happens ony in tests with enzyme's mount
		return [];
	}
	return [children];
}

function HomeListView({ sidepanel, list, header, children }) {
	if (!sidepanel || !list) {
		return null;
	}
	let drawers = children || [];
	if (!Array.isArray(drawers)) {
		drawers = wrapChildren(drawers);
	}

	return (
		<Layout
			mode="TwoColumns"
			header={getContent('AppHeaderBar', header)}
			one={getContent('SidePanel', sidepanel)}
			drawers={drawers}
		>
			{getContent('List', list)}
		</Layout>
	);
}

HomeListView.displayName = 'HomeListView';
HomeListView.propTypes = {
	header: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.object,
	]),
	sidepanel: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.object,
	]).isRequired,
	list: PropTypes.oneOfType([
		PropTypes.element,
		PropTypes.object,
	]).isRequired,
	children: PropTypes.node,
};

export default HomeListView;
