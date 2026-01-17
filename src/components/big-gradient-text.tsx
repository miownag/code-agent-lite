import Gradient, { GradientColors, GradientName } from 'ink-gradient';
import BigText, { CFontProps } from 'ink-big-text';

const BigGradientText = ({
  text,
  colors,
  gradientName = 'rainbow',
  lineHeight = 1,
  font,
}: {
  text: string;
  colors?: GradientColors;
  gradientName?: GradientName;
  lineHeight?: number;
  font?: CFontProps['font'];
}) => {
  return (
    <Gradient name={colors ? undefined : gradientName} colors={colors}>
      <BigText text={text} lineHeight={lineHeight} font={font} />
    </Gradient>
  );
};

export default BigGradientText;
