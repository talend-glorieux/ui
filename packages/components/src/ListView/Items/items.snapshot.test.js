import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import Items from './Items.component';

jest.mock('../../../node_modules/react-virtualized/dist/commonjs/AutoSizer/AutoSizer', () => props =>
	<div id="autoSizer">{ props.children({ height: 30, width: 30 }) }</div> // eslint-disable-line react/prop-types
);

describe('Items', () => {
	const props = {
		items: [
			{ label: 'Lorem ipsum dolor sit amet 0' },
			{ label: 'Lorem ipsum dolor sit amet 1', checked: true },
			{ label: 'Lorem ipsum dolor sit amet 2' },
		],
		getItemHeight: () => 42,
	};

	it('should render', () => {
		// when
		const wrapper = mount(<Items {...props} />);

		// then
		expect(toJson(wrapper)).toMatchSnapshot();
	});

	it('should render with provided id', () => {
		// when
		const wrapper = mount(<Items {...props} id={'my-widget'} />);

		// then
		expect(toJson(wrapper)).toMatchSnapshot();
	});
});
