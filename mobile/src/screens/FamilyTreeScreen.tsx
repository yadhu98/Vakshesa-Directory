import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  TextInput,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, G, Text as SvgText } from 'react-native-svg';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

const colors = {
  Kadannamanna: '#1E40AF',
  Mankada: '#059669',
  Ayiranazhi: '#DC2626',
  Aripra: '#7C3AED',
  male: '#60A5FA',
  female: '#F472B6',
  other: '#A78BFA',
};

interface FamilyMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  house: string;
  gender?: 'male' | 'female' | 'other';
  generation?: number;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  children?: string[];
  dateOfBirth?: string;
  isAlive?: boolean;
  profilePicture?: string;
}

interface TreeNode {
  member: FamilyMember;
  x: number;
  y: number;
  children: TreeNode[];
}

const NODE_RADIUS = 40;
const HORIZONTAL_SPACING = 140;
const VERTICAL_SPACING = 180;

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface InteractiveNodeProps {
  node: TreeNode;
  onPress: (member: FamilyMember) => void;
  memberMap: Map<string, TreeNode>;
}

// Render a single interactive node
const InteractiveNode: React.FC<InteractiveNodeProps> = ({ node, onPress, memberMap }) => {
  if (!node || !node.member) return null;

  const nodeColor = getNodeColorStatic(node.member);
  const initials = `${node.member.firstName?.[0] || ''}${node.member.lastName?.[0] || ''}`.toUpperCase();

  return (
    <G key={node.member._id}>
      <Circle
        cx={node.x}
        cy={node.y}
        r={NODE_RADIUS}
        fill={nodeColor}
        stroke="#fff"
        strokeWidth={3}
        onPress={() => onPress(node.member)}
      />
      <SvgText
        x={node.x}
        y={node.y + 6}
        fontSize="20"
        fontWeight="bold"
        fill="#fff"
        textAnchor="middle"
        onPress={() => onPress(node.member)}
      >
        {initials}
      </SvgText>
      <SvgText
        x={node.x}
        y={node.y + NODE_RADIUS + 18}
        fontSize="10"
        fontWeight="500"
        fill="#1F2937"
        textAnchor="middle"
      >
        {node.member.firstName}
      </SvgText>
    </G>
  );
};

function getNodeColorStatic(member: FamilyMember): string {
  if (member.house && colors[member.house as keyof typeof colors]) {
    return colors[member.house as keyof typeof colors];
  } else if (member.gender && colors[member.gender as keyof typeof colors]) {
    return colors[member.gender as keyof typeof colors];
  }
  return '#6366f1';
}

// Petal button component with animation
interface PetalButtonProps {
  position: { x: number; y: number };
  member: FamilyMember;
  onPress: () => void;
}

const PetalButton: React.FC<PetalButtonProps> = ({ position, member, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.85,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.petalButtonContainer,
        {
          left: position.x - NODE_RADIUS,
          top: position.y - NODE_RADIUS,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.petalButton}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View />
      </TouchableOpacity>
    </Animated.View>
  );
};

const FamilyTreeScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedHouse, setSelectedHouse] = useState<string>('Kadannamanna');
  const [allMembers, setAllMembers] = useState<FamilyMember[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [focusedMember, setFocusedMember] = useState<FamilyMember | null>(null);
  const [microFamilyMode, setMicroFamilyMode] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<FamilyMember[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Animation states
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const nodeAnimRefs = useRef<{ [key: string]: { scale: Animated.Value; opacity: Animated.Value } }>({}).current;

  const houses = ['Kadannamanna', 'Mankada', 'Ayiranazhi', 'Aripra'];
  const panResponderRef = useRef<any>(null);

  useEffect(() => {
    loadFamilyTree();
  }, [selectedHouse]);

  useEffect(() => {
    if (!panResponderRef.current) {
      let lastX = 0;
      let lastY = 0;

      panResponderRef.current = PanResponder.create({
        onStartShouldSetPanResponder: () => !microFamilyMode,
        onMoveShouldSetPanResponder: () => !microFamilyMode,
        onPanResponderGrant: () => {
          lastX = panX;
          lastY = panY;
        },
        onPanResponderMove: (evt, gestureState) => {
          const newX = lastX + gestureState.dx;
          const newY = lastY + gestureState.dy;
          setPanX(newX);
          setPanY(newY);
        },
      });
    }
  }, [microFamilyMode, panX, panY]);

  // Animation trigger when entering/exiting micro family mode
  useEffect(() => {
    if (microFamilyMode && focusedMember) {
      // Animate in
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [microFamilyMode, focusedMember]);

  const loadFamilyTree = async () => {
    try {
      setLoading(true);
      setFocusedMember(null);
      setMicroFamilyMode(false);
      setNavigationHistory([]);

      const response = await api.get(`/family-tree/family-default?house=${selectedHouse}`);
      let members = response.data.tree || [];

      if (Array.isArray(members) && members.length > 0 && members[0] && !members[0].member) {
        members = members.map((user: any) => ({
          member: user,
          children: [],
        }));
      }

      const flatMembers = flattenTree(members);
      setAllMembers(flatMembers);

      const nodes = buildTreeLayout(members);
      setTreeData(nodes);
    } catch (error) {
      console.error('Error loading family tree:', error);
      setAllMembers([]);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNodePress = (member: FamilyMember) => {
    if (microFamilyMode) {
      // In micro family mode, navigate to the clicked member
      // Add current focused member to history for back navigation
      setNavigationHistory([...navigationHistory, focusedMember!]);
      setFocusedMember(member);
    } else {
      // In full tree mode, enter micro family mode for clicked member
      setFocusedMember(member);
      setMicroFamilyMode(true);
      setNavigationHistory([]);
    }
  };

  const handleBackNavigation = () => {
    if (navigationHistory.length > 0) {
      // Pop from history and navigate back
      const previousMember = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setFocusedMember(previousMember);
    } else {
      // No history, exit micro family mode
      setMicroFamilyMode(false);
      setFocusedMember(null);
    }
  };

  const getGenerationInfo = (member: FamilyMember) => {
    const generation = member.generation || 1;
    const generationLabel = {
      1: 'Gen 1 (Grandparent)',
      2: 'Gen 2 (Parent)',
      3: 'Gen 3 (Your Gen)',
      4: 'Gen 4 (Children)',
      5: 'Gen 5 (Grandchildren)',
    }[generation] || `Gen ${generation}`;
    return { generation, generationLabel };
  };

  // Search filtering
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers;
    const query = searchQuery.toLowerCase();
    return allMembers.filter(
      (member) =>
        member.firstName.toLowerCase().includes(query) ||
        member.lastName.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
    );
  }, [searchQuery, allMembers]);

  // Render search results
  const renderSearchResults = () => {
    return (
      <Modal
        visible={showSearch}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSearch(false)}
      >
        <SafeAreaView style={styles.searchModal}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity
                style={styles.searchCloseBtn}
                onPress={() => setShowSearch(false)}
              >
                <Text style={styles.searchCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultItem}
                  onPress={() => {
                    handleNodePress(item);
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                >
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>
                      {item.firstName} {item.lastName}
                    </Text>
                    <Text style={styles.searchResultEmail}>{item.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.searchResultAvatar,
                      { backgroundColor: getNodeColorStatic(item) },
                    ]}
                  >
                    <Text style={styles.searchResultAvatarText}>
                      {item.firstName?.[0]}{item.lastName?.[0]}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptySearchContainer}>
                  <Text style={styles.emptySearchText}>No members found</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  const getMicroFamilyData = (member: FamilyMember) => {
    const father = member.fatherId ? allMembers.find((m) => m._id === member.fatherId) : null;
    const mother = member.motherId ? allMembers.find((m) => m._id === member.motherId) : null;
    const spouse = member.spouseId ? allMembers.find((m) => m._id === member.spouseId) : null;
    const children = member.children ? allMembers.filter((m) => member.children?.includes(m._id)) : [];

    return { father, mother, spouse, children };
  };

  const renderFlowerPetalChart = () => {
    if (!focusedMember) return null;

    const { father, mother, spouse, children } = getMicroFamilyData(focusedMember);
    const containerWidth = SCREEN_WIDTH - 40;
    const containerHeight = SCREEN_HEIGHT - 280;

    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2.5;
    const petalRadius = 140; // Distance from center to petals

    // Calculate positions for all related members
    const getRelationPosition = (type: string, index: number = 0) => {
      const angleMap: { [key: string]: number } = {
        father: 135, // Top-left
        mother: 45, // Top-right
        spouse: 0, // Right
        child: 270, // Bottom (spread if multiple)
      };

      let angle = angleMap[type] || 0;
      
      // Spread children in a fan at bottom
      if (type === 'child' && children.length > 1) {
        const startAngle = 270 - (children.length - 1) * 20;
        angle = startAngle + index * 40;
      }

      const radians = (angle * Math.PI) / 180;
      return {
        x: centerX + petalRadius * Math.cos(radians),
        y: centerY + petalRadius * Math.sin(radians),
      };
    };

    // Render SVG lines and nodes
    const renderFlowerChart = () => {
      const lines: any[] = [];
      const nodes: any[] = [];

      const drawConnectingLine = (fromX: number, fromY: number, toX: number, toY: number, key: string, isDashed = false) => {
        const angle = Math.atan2(toY - centerY, toX - centerX);
        const startX = centerX + (NODE_RADIUS + 4) * Math.cos(angle);
        const startY = centerY + (NODE_RADIUS + 4) * Math.sin(angle);
        const endX = toX - NODE_RADIUS * Math.cos(angle);
        const endY = toY - NODE_RADIUS * Math.sin(angle);

        lines.push(
          <Line
            key={`line-${key}`}
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={isDashed ? '#F59E0B' : '#CBD5E1'}
            strokeWidth={isDashed ? 2.5 : 2}
            strokeDasharray={isDashed ? '4,4' : 'none'}
            opacity={0.7}
          />
        );
      };

      // Father
      if (father) {
        const fatherPos = getRelationPosition('father');
        drawConnectingLine(centerX, centerY, fatherPos.x, fatherPos.y, `father-${father._id}`);
        nodes.push(
          <G key={`father-node-${father._id}`}>
            <Circle
              cx={fatherPos.x}
              cy={fatherPos.y}
              r={NODE_RADIUS - 5}
              fill={colors.male}
              stroke="#fff"
              strokeWidth={2.5}
            />
            <SvgText
              x={fatherPos.x}
              y={fatherPos.y + 4}
              fontSize="13"
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              {father.firstName?.[0]}{father.lastName?.[0]}
            </SvgText>
            <SvgText
              x={fatherPos.x}
              y={fatherPos.y + 28}
              fontSize="7"
              fill="#64748B"
              textAnchor="middle"
            >
              Father
            </SvgText>
          </G>
        );
      }

      // Mother
      if (mother) {
        const motherPos = getRelationPosition('mother');
        drawConnectingLine(centerX, centerY, motherPos.x, motherPos.y, `mother-${mother._id}`);
        nodes.push(
          <G key={`mother-node-${mother._id}`}>
            <Circle
              cx={motherPos.x}
              cy={motherPos.y}
              r={NODE_RADIUS - 5}
              fill={colors.female}
              stroke="#fff"
              strokeWidth={2.5}
            />
            <SvgText
              x={motherPos.x}
              y={motherPos.y + 4}
              fontSize="13"
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              {mother.firstName?.[0]}{mother.lastName?.[0]}
            </SvgText>
            <SvgText
              x={motherPos.x}
              y={motherPos.y + 28}
              fontSize="7"
              fill="#64748B"
              textAnchor="middle"
            >
              Mother
            </SvgText>
          </G>
        );
      }

      // Spouse
      if (spouse) {
        const spousePos = getRelationPosition('spouse');
        drawConnectingLine(centerX, centerY, spousePos.x, spousePos.y, `spouse-${spouse._id}`, true);
        nodes.push(
          <G key={`spouse-node-${spouse._id}`}>
            <Circle
              cx={spousePos.x}
              cy={spousePos.y}
              r={NODE_RADIUS - 5}
              fill={getNodeColorStatic(spouse)}
              stroke="#F59E0B"
              strokeWidth={2.5}
            />
            <SvgText
              x={spousePos.x}
              y={spousePos.y + 4}
              fontSize="13"
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              {spouse.firstName?.[0]}{spouse.lastName?.[0]}
            </SvgText>
            <SvgText
              x={spousePos.x}
              y={spousePos.y + 28}
              fontSize="7"
              fill="#F59E0B"
              textAnchor="middle"
            >
              Spouse
            </SvgText>
          </G>
        );
      }

      // Children
      children.forEach((child, idx) => {
        const childPos = getRelationPosition('child', idx);
        drawConnectingLine(centerX, centerY, childPos.x, childPos.y, `child-${child._id}`);
        nodes.push(
          <G key={`child-node-${child._id}`}>
            <Circle
              cx={childPos.x}
              cy={childPos.y}
              r={NODE_RADIUS - 5}
              fill={getNodeColorStatic(child)}
              stroke="#fff"
              strokeWidth={2}
            />
            <SvgText
              x={childPos.x}
              y={childPos.y + 4}
              fontSize="13"
              fontWeight="bold"
              fill="#fff"
              textAnchor="middle"
            >
              {child.firstName?.[0]}{child.lastName?.[0]}
            </SvgText>
            <SvgText
              x={childPos.x}
              y={childPos.y + 26}
              fontSize="7"
              fill="#64748B"
              textAnchor="middle"
            >
              Child
            </SvgText>
          </G>
        );
      });

      // Center focused member (LARGE)
      const memberColor = getNodeColorStatic(focusedMember);
      nodes.push(
        <G key={`center-${focusedMember._id}`}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={NODE_RADIUS + 10}
            fill={memberColor}
            stroke="#fff"
            strokeWidth={4}
          />
          <SvgText
            x={centerX}
            y={centerY + 6}
            fontSize="22"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
          >
            {focusedMember.firstName?.[0]}{focusedMember.lastName?.[0]}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 38}
            fontSize="8"
            fill="#fff"
            textAnchor="middle"
            fontWeight="bold"
          >
            YOU
          </SvgText>
        </G>
      );

      return (
        <Svg width={containerWidth} height={containerHeight}>
          {lines}
          {nodes}
        </Svg>
      );
    };

    return (
      <Animated.View
        style={[
          styles.flowerChartContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {renderFlowerChart()}

        {/* Interactive overlay buttons */}
        {father && (
          <PetalButton
            position={getRelationPosition('father')}
            member={father}
            onPress={() => handleNodePress(father)}
          />
        )}
        {mother && (
          <PetalButton
            position={getRelationPosition('mother')}
            member={mother}
            onPress={() => handleNodePress(mother)}
          />
        )}
        {spouse && (
          <PetalButton
            position={getRelationPosition('spouse')}
            member={spouse}
            onPress={() => handleNodePress(spouse)}
          />
        )}
        {children.map((child, idx) => (
          <PetalButton
            key={`petal-${child._id}`}
            position={getRelationPosition('child', idx)}
            member={child}
            onPress={() => handleNodePress(child)}
          />
        ))}
      </Animated.View>
    );
  };  const renderMicroFamilyTree = () => {
    return renderFlowerPetalChart();
  };
  
    const renderFullTree = () => {
      const elements: any[] = [];
      const nodeElements: any[] = [];
      const memberMap = new Map<string, TreeNode>();

    // Build member map
    function mapMembers(node: TreeNode | null | undefined) {
      if (!node || !node.member) return;
      memberMap.set(node.member._id, node);
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(mapMembers);
      }
    }

    treeData.forEach(mapMembers);

    // Render connecting lines
    function renderLines(node: TreeNode | null | undefined) {
      if (!node || !node.member) return;

      // Spouse line
      if (node.member.spouseId && memberMap.has(node.member.spouseId)) {
        const spouse = memberMap.get(node.member.spouseId)!;
        if (spouse && spouse.member) {
          elements.push(
            <Line
              key={`spouse-${node.member._id}-${spouse.member._id}`}
              x1={node.x}
              y1={node.y}
              x2={spouse.x}
              y2={spouse.y}
              stroke="#F59E0B"
              strokeWidth={3}
              strokeDasharray="5,5"
            />
          );
        }
      }

      // Children lines
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          if (child && child.member) {
            const midY = node.y + (child.y - node.y) / 3;

            elements.push(
              <Line
                key={`vert-${node.member._id}`}
                x1={node.x}
                y1={node.y + NODE_RADIUS}
                x2={node.x}
                y2={midY}
                stroke="#64748B"
                strokeWidth={2}
              />
            );

            elements.push(
              <Line
                key={`horiz-${node.member._id}-${child.member._id}`}
                x1={node.x}
                y1={midY}
                x2={child.x}
                y2={midY}
                stroke="#64748B"
                strokeWidth={2}
              />
            );

            elements.push(
              <Line
                key={`line-${node.member._id}-${child.member._id}`}
                x1={child.x}
                y1={midY}
                x2={child.x}
                y2={child.y - NODE_RADIUS}
                stroke="#64748B"
                strokeWidth={2}
              />
            );
          }
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(renderLines);
      }
    }

    // Render nodes
    function renderNodes(node: TreeNode | null | undefined) {
      if (!node || !node.member) return;

      const nodeColor = getNodeColorStatic(node.member);
      const initials = `${node.member.firstName?.[0] || ''}${node.member.lastName?.[0] || ''}`.toUpperCase();

      nodeElements.push(
        <G key={node.member._id}>
          <Circle
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS}
            fill={nodeColor}
            stroke="#fff"
            strokeWidth={3}
            onPress={() => handleNodePress(node.member)}
          />
          <SvgText
            x={node.x}
            y={node.y + 6}
            fontSize="20"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
            onPress={() => handleNodePress(node.member)}
          >
            {initials}
          </SvgText>
          <SvgText
            x={node.x}
            y={node.y + NODE_RADIUS + 18}
            fontSize="10"
            fontWeight="500"
            fill="#1F2937"
            textAnchor="middle"
          >
            {node.member.firstName}
          </SvgText>
        </G>
      );

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(renderNodes);
      }
    }

    treeData.forEach(renderLines);
    treeData.forEach(renderNodes);

    return (
      <Svg
        width={SCREEN_WIDTH * 2.5}
        height={SCREEN_HEIGHT * 3}
      >
        {elements}
        {nodeElements}
      </Svg>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader title="Family Tree" />

        {!microFamilyMode && (
          <View style={styles.houseSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {houses.map((house) => (
                <TouchableOpacity
                  key={house}
                  style={[
                    styles.houseButton,
                    selectedHouse === house && styles.houseButtonActive,
                  ]}
                  onPress={() => setSelectedHouse(house)}
                >
                  <Text
                    style={[
                      styles.houseButtonText,
                      selectedHouse === house && styles.houseButtonTextActive,
                    ]}
                  >
                    {house}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setShowSearch(true)}
            >
              <Text style={styles.searchButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        )}

        {microFamilyMode && focusedMember && (
          <View>
            <View style={styles.microFamilyHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleBackNavigation}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.microFamilyTitle}>
                  {focusedMember.firstName} {focusedMember.lastName}
                </Text>
                <Text style={styles.generationLabel}>
                  {getGenerationInfo(focusedMember).generationLabel}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.zoomOutButton}
                onPress={() => {
                  setMicroFamilyMode(false);
                  setFocusedMember(null);
                  setNavigationHistory([]);
                }}
              >
                <Text style={styles.zoomOutText}>Full Tree</Text>
              </TouchableOpacity>
            </View>
            {navigationHistory.length > 0 && (
              <View style={styles.breadcrumbContainer}>
                <Text style={styles.breadcrumbText}>
                  Breadcrumb: {navigationHistory.map(m => m.firstName).join(' → ')} → {focusedMember.firstName}
                </Text>
              </View>
            )}
          </View>
        )}

        {treeData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No family tree data</Text>
          </View>
        ) : microFamilyMode ? (
          <ScrollView style={styles.microFamilyContainer}>
            <View style={styles.microFamilyContent}>{renderMicroFamilyTree()}</View>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
              >
                <Text style={styles.zoomButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.zoomText}>{(zoomLevel * 100).toFixed(0)}%</Text>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.fullTreeContainer, panResponderRef.current?.panHandlers]}>
            <ScrollView
              horizontal
              scrollEventThrottle={16}
              style={styles.horizontalScroll}
            >
              <ScrollView scrollEventThrottle={16}>
                {renderFullTree()}
              </ScrollView>
            </ScrollView>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
              >
                <Text style={styles.zoomButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.zoomText}>{(zoomLevel * 100).toFixed(0)}%</Text>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.2))}
              >
                <Text style={styles.zoomButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {renderSearchResults()}

      <Modal visible={!!selectedMember} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedMember && (
              <>
                <View
                  style={[
                    styles.modalHeader,
                    { backgroundColor: getNodeColorStatic(selectedMember) },
                  ]}
                >
                  <TouchableOpacity onPress={() => setSelectedMember(null)}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.modalTitle}>
                    {selectedMember.firstName} {selectedMember.lastName}
                  </Text>
                </View>
                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{selectedMember.email}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Generation</Text>
                    <Text style={styles.detailValue}>{selectedMember.generation || 1}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Gender</Text>
                    <Text style={styles.detailValue}>{selectedMember.gender || 'Not specified'}</Text>
                  </View>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>House</Text>
                    <Text style={styles.detailValue}>{selectedMember.house || 'Not assigned'}</Text>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  houseSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  houseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  houseButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  houseButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  houseButtonTextActive: {
    color: '#fff',
  },
  fullTreeContainer: {
    flex: 1,
  },
  horizontalScroll: {
    flex: 1,
  },
  microFamilyHeader: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  microFamilyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  generationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    marginTop: 2,
  },
  breadcrumbContainer: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  breadcrumbText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  zoomOutButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  zoomOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366f1',
  },
  microFamilyContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  microFamilyContent: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  zoomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  zoomButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  zoomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    minWidth: 60,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    paddingHorizontal: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  // Search styles
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchButtonText: {
    fontSize: 20,
  },
  searchModal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 10,
  },
  searchCloseBtn: {
    padding: 8,
  },
  searchCloseBtnText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  searchResultItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  searchResultEmail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  searchResultAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptySearchContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500',
  },
  // SVG and node button styles
  svgLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  nodeButton: {
    position: 'absolute',
    width: NODE_RADIUS * 2 + 10,
    height: NODE_RADIUS * 2 + 10,
    borderRadius: NODE_RADIUS + 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: NODE_RADIUS + 5,
  },
  // Flower petal chart styles
  flowerChartContainer: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  petalButtonContainer: {
    position: 'absolute',
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petalButton: {
    width: NODE_RADIUS * 2,
    height: NODE_RADIUS * 2,
    borderRadius: NODE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function flattenTree(members: any): FamilyMember[] {
  const result: FamilyMember[] = [];

  function traverse(node: any) {
    if (!node) return;
    if (node.member) {
      result.push(node.member);
    }
    if (Array.isArray(node.children)) {
      node.children.forEach(traverse);
    }
  }

  if (Array.isArray(members)) {
    members.forEach(traverse);
  } else if (members) {
    traverse(members);
  }

  return result;
}

function buildTreeLayout(members: any): TreeNode[] {
  if (!members) {
    return [];
  }

  function layout(node: any, depth: number, xOffset: number): { treeNode: TreeNode; width: number } | null {
    if (!node || !node.member) {
      return null;
    }

    if (!node.children || node.children.length === 0) {
      const treeNode: TreeNode = {
        member: node.member,
        x: xOffset,
        y: depth * VERTICAL_SPACING + 60,
        children: [],
      };
      return { treeNode, width: HORIZONTAL_SPACING };
    }

    let childX = xOffset;
    const children: TreeNode[] = [];
    let totalWidth = 0;

    for (let i = 0; i < node.children.length; i++) {
      const result = layout(node.children[i], depth + 1, childX);
      if (result) {
        const { treeNode: childNode, width: childWidth } = result;
        children.push(childNode);
        childX += childWidth;
        totalWidth += childWidth;
      }
    }

    const nodeX =
      children.length === 0
        ? xOffset
        : children.length === 1
        ? children[0].x
        : (children[0].x + children[children.length - 1].x) / 2;

    const treeNode: TreeNode = {
      member: node.member,
      x: nodeX,
      y: depth * VERTICAL_SPACING + 60,
      children,
    };

    return { treeNode, width: totalWidth || HORIZONTAL_SPACING };
  }

  const roots: TreeNode[] = [];
  let xOffset = 80;

  if (Array.isArray(members)) {
    for (let i = 0; i < members.length; i++) {
      const result = layout(members[i], 0, xOffset);
      if (result) {
        const { treeNode, width } = result;
        roots.push(treeNode);
        xOffset += width + HORIZONTAL_SPACING * 2;
      }
    }
  } else if (members) {
    const result = layout(members, 0, xOffset);
    if (result) {
      const { treeNode } = result;
      roots.push(treeNode);
    }
  }

  return roots;
}

export default FamilyTreeScreen;
