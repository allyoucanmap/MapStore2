import emptyState from '../../misc/enhancers/emptyState';
import WidgetEmptyMessage from '../widget/WidgetEmptyMessage';

// viewport filters are the transient filters of the map interactions
const hasViewportFilter = (filters) => Array.isArray(filters) && filters.some(filter => filter?.transient);
const isFilteredByViewport = ({ interactionFilters, traces } = {}) =>
    hasViewportFilter(interactionFilters) || (traces || []).some(trace => hasViewportFilter(trace?.interactionFilters));

export default emptyState(
    ({data = []}) => !data || data.length === 0 || data?.flat()?.length === 0,
    ({iconFit, ...props} = {}) => ({
        iconFit,
        messageId: isFilteredByViewport(props) ? "widgets.errors.nodatainviewport" : "widgets.errors.nodata",
        glyph: 'chart'
    }),
    WidgetEmptyMessage
);
