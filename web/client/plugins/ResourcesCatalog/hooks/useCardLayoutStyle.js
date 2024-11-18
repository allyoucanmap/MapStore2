import useLocalStorage from './useLocalStorage';

const useCardLayoutStyle = ({
    cardLayoutStyle,
    defaultCardLayoutStyle
}) => {
    const [_cardLayoutStyleState, setCardLayoutStyle] = useLocalStorage('layoutCardsStyle', defaultCardLayoutStyle);
    const cardLayoutStyleState = cardLayoutStyle || _cardLayoutStyleState; // Force style when `cardLayoutStyle` is configured
    const hideCardLayoutButton = !!cardLayoutStyle;
    return {
        cardLayoutStyle: cardLayoutStyleState,
        setCardLayoutStyle,
        hideCardLayoutButton
    };
};

export default useCardLayoutStyle;
